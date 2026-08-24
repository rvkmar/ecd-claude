# modules/irt.R (enhanced with parallel computing support)
# Robust IRT endpoints for ECD assessment with async/parallel capabilities
# Exposes:
#   POST /irt/estimate       -> per-student ability estimation (EAP or MLE)
#   POST /irt/estimate-async -> async version with promises
#   POST /irt/calibrate      -> group calibration (2PL or 3PL)
#   POST /irt/calibrate-async-> async calibration
#   POST /irt/batch-estimate -> parallel batch processing

library(plumber)
library(jsonlite)
library(mirt)
library(future)
library(promises)
library(callr)

# ---------------------------
# Initialize parallel backend
# ---------------------------

# Setup multisession plan with configurable workers
.init_parallel <- function(workers = NULL) {
  if (is.null(workers)) {
    workers <- max(2, availableCores() - 1)
  }
  plan(multisession, workers = workers)
  message(sprintf("Parallel backend initialized with %d workers", workers))
}

# Initialize on module load (can be reconfigured)
.init_parallel()

# ---------------------------
# Helpers (inlined)
# ---------------------------

.as_num <- function(x, default = NA_real_) {
  if (is.null(x)) return(default)
  suppressWarnings(as.numeric(x))
}

.parse_body <- function(req) {
  tryCatch({
    if (is.null(req$postBody) || nchar(req$postBody) == 0) return(NULL)
    jsonlite::fromJSON(req$postBody, simplifyVector = FALSE)
  }, error = function(e) NULL)
}

# ---------------------------
# Core IRT functions (extracted for reuse)
# ---------------------------

.perform_irt_estimation <- function(responses, items, method = "EAP") {
  method <- if (method %in% c("EAP", "MLE")) method else "EAP"
  
  qids <- vapply(items, FUN = function(i) as.character(i$id), FUN.VALUE = "")
  resp_vec <- rep(NA_real_, length(qids)); names(resp_vec) <- qids
  
  for (r in responses) {
    qid <- if (!is.null(r$questionId)) as.character(r$questionId) else NULL
    val <- if (!is.null(r$scoredValue)) .as_num(r$scoredValue) else NA_real_
    if (!is.null(qid) && qid %in% qids) resp_vec[[qid]] <- val
  }
  
  nAnswered <- sum(!is.na(resp_vec))
  if (nAnswered < 2) {
    prop <- ifelse(nAnswered == 0, NA_real_, mean(resp_vec, na.rm = TRUE))
    theta_est <- ifelse(is.na(prop), NA_real_, qnorm(min(max(prop, 1e-6), 1 - 1e-6)))
    return(list(method = "fallback_proportion", theta = theta_est,
                stderr = NA_real_, nItemsAnswered = nAnswered,
                note = "Too few items answered, used fallback"))
  }
  
  resp_df <- as.data.frame(t(resp_vec), stringsAsFactors = FALSE)
  resp_df[] <- lapply(resp_df, function(x) { 
    if (all(is.na(x))) return(as.numeric(x))
    as.numeric(x) 
  })
  
  a_par <- sapply(items, function(i) if (!is.null(i$a)) .as_num(i$a) else 1.0)
  b_par <- sapply(items, function(i) if (!is.null(i$b)) .as_num(i$b) else 0.0)
  c_par <- sapply(items, function(i) if (!is.null(i$c)) .as_num(i$c) else 0.0)
  
  par_table <- data.frame(a1 = a_par, d = -a_par * b_par, g = c_par, u = 1,
                          row.names = qids, stringsAsFactors = FALSE)
  
  fit_model <- NULL
  estimation_method_used <- method
  
  try({
    provided_params <- sum(!is.na(a_par) | !is.na(b_par) | !is.na(c_par))
    if (provided_params >= max(2, floor(0.5 * length(qids)))) {
      itemtype <- ifelse(any(c_par > 0), "3PL", "2PL")
      fit_model <- tryCatch({
        mirt(resp_df, 1, itemtype = itemtype, pars = par_table, SE = TRUE, 
             verbose = FALSE, technical = list(NCYCLES = 50))
      }, error = function(e) NULL)
    }
    if (is.null(fit_model)) {
      itemtype <- ifelse(any(c_par > 0), "3PL", "2PL")
      fit_model <- tryCatch({ 
        suppressWarnings(mirt(resp_df, 1, itemtype = itemtype, verbose = FALSE)) 
      }, error = function(e) NULL)
    }
  }, silent = TRUE)
  
  if (is.null(fit_model)) {
    prop <- mean(resp_vec, na.rm = TRUE)
    theta_est <- qnorm(min(max(prop, 1e-6), 1 - 1e-6))
    return(list(method = "fallback_proportion_after_fail", theta = theta_est, 
                stderr = NA_real_, nItemsAnswered = nAnswered, 
                note = "IRT model fitting failed, used fallback"))
  }
  
  fs <- NULL
  try({
    if (method == "MLE") {
      fs <- tryCatch({ 
        fscores(fit_model, method = "ML", full.scores.SE = TRUE) 
      }, error = function(e) NULL)
      if (is.null(fs)) {
        fs <- fscores(fit_model, method = "EAP", full.scores.SE = TRUE)
        estimation_method_used <- "EAP (fallback)"
      }
    } else {
      fs <- fscores(fit_model, method = "EAP", full.scores.SE = TRUE)
      estimation_method_used <- "EAP"
    }
  }, silent = TRUE)
  
  if (is.null(fs)) {
    prop <- mean(resp_vec, na.rm = TRUE)
    theta_est <- qnorm(min(max(prop, 1e-6), 1 - 1e-6))
    return(list(method = "fallback_proportion_after_fs_fail", theta = theta_est, 
                stderr = NA_real_, nItemsAnswered = nAnswered, 
                note = "fscores failed, used fallback"))
  }
  
  theta_val <- as.numeric(fs[1, 1])
  stderr_val <- as.numeric(fs[1, 2])
  
  item_info <- tryCatch({
    sapply(qids, function(qid) {
      ii <- tryCatch({ 
        iteminfo(fit_model, Theta = theta_val)[, qid] 
      }, error = function(e) NA_real_)
      if (is.null(ii) || length(ii) == 0) NA_real_ else as.numeric(ii)
    })
  }, error = function(e) rep(NA_real_, length(qids)))
  
  test_info_val <- tryCatch({ 
    testinfo(fit_model, Theta = theta_val) 
  }, error = function(e) NA_real_)
  
  itemInfos <- lapply(seq_along(qids), function(i) 
    list(id = qids[i], info = as.numeric(item_info[i])))
  
  return(list(method = estimation_method_used, theta = theta_val, 
              stderr = stderr_val, nItemsAnswered = nAnswered, 
              itemInfos = itemInfos, testInfo = as.numeric(test_info_val)))
}

.perform_irt_calibration <- function(responses, evModel) {
  model_type <- evModel$measurementModel$irtConfig$model
  if (!(model_type %in% c("2PL", "3PL"))) {
    return(list(error = paste("Unsupported IRT model:", model_type)))
  }
  
  all_qids <- unique(unlist(lapply(responses, function(r) names(r$answers))))
  if (length(all_qids) < 2 || length(responses) < 2) {
    return(list(error = "Too few items/students for calibration, need at least 2x2 matrix"))
  }
  
  mat <- do.call(rbind, lapply(responses, function(r) {
    row <- rep(NA_real_, length(all_qids))
    names(row) <- all_qids
    for (qid in names(r$answers)) row[qid] <- .as_num(r$answers[[qid]])
    row
  }))
  resp_df <- as.data.frame(mat)
  
  model <- tryCatch({
    mirt(resp_df, 1, itemtype = model_type, verbose = FALSE)
  }, error = function(e) {
    message("Calibration error: ", e$message)
    NULL
  })
  
  if (is.null(model)) {
    return(list(error = "Calibration failed: not enough variability or convergence issue"))
  }
  
  coefs <- tryCatch({ 
    coef(model, IRTpars = TRUE, simplify = TRUE)$items 
  }, error = function(e) NULL)
  
  if (is.null(coefs)) {
    return(list(error = "Calibration failed: unable to extract coefficients"))
  }
  
  message("Calibration coefficients structure:")
  message(capture.output(str(coefs)))
  
  required_cols <- intersect(c("a1","b","g"), colnames(coefs))
  items_out <- lapply(1:nrow(coefs), function(i) {
    list(
      id = if (!is.null(rownames(coefs))) rownames(coefs)[i] else paste0("item", i),
      a = if ("a1" %in% required_cols) unname(coefs[i, "a1"]) else NA,
      b = if ("b" %in% required_cols) unname(coefs[i, "b"]) else NA,
      c = if ("g" %in% required_cols) unname(coefs[i, "g"]) else 0
    )
  })
  
  return(list(model = model_type, items = items_out))
}

# ---------------------------
# Parallel batch processing using callr
# ---------------------------

.batch_estimate_parallel <- function(batch_data, items, method = "EAP", use_callr = FALSE) {
  if (use_callr) {
    # Use callr for completely isolated R sessions
    results <- lapply(batch_data, function(student_data) {
      callr::r(
        func = function(responses, items, method) {
          # Need to reload libraries in new R session
          library(mirt)
          source("/home/app/modules/irt.R")
          .perform_irt_estimation(responses, items, method)
        },
        args = list(
          responses = student_data$responses,
          items = items,
          method = method
        ),
        error = "error"
      )
    })
  } else {
    # Use future for lighter-weight parallelization
    futures <- lapply(batch_data, function(student_data) {
      future({
        .perform_irt_estimation(student_data$responses, items, method)
      })
    })
    results <- lapply(futures, value)
  }
  
  return(results)
}

# ---------------------------
# IRT API factory
# ---------------------------

irt_api <- function() {
  pr <- Plumber$new()
  
  # ---------------------------
  # POST /irt/estimate (original synchronous)
  # ---------------------------
  pr$handle("POST", "/irt/estimate", function(req, res) {
    body <- .parse_body(req)
    if (is.null(body)) {
      res$status <- 400
      return(list(error = "Invalid JSON body"))
    }
    
    responses <- body$responses
    items <- body$itemBank
    method_in <- if (!is.null(body$method)) toupper(as.character(body$method)) else "EAP"
    
    if (is.null(responses) || length(responses) == 0) {
      res$status <- 400
      return(list(error = "No responses provided"))
    }
    if (is.null(items) || length(items) == 0) {
      res$status <- 400
      return(list(error = "No itemBank provided"))
    }
    
    return(.perform_irt_estimation(responses, items, method_in))
  })
  
  # ---------------------------
  # POST /irt/estimate-async (async with promises)
  # ---------------------------
  pr$handle("POST", "/irt/estimate-async", function(req, res) {
    body <- .parse_body(req)
    if (is.null(body)) {
      res$status <- 400
      return(list(error = "Invalid JSON body"))
    }
    
    responses <- body$responses
    items <- body$itemBank
    method_in <- if (!is.null(body$method)) toupper(as.character(body$method)) else "EAP"
    
    if (is.null(responses) || length(responses) == 0) {
      res$status <- 400
      return(list(error = "No responses provided"))
    }
    if (is.null(items) || length(items) == 0) {
      res$status <- 400
      return(list(error = "No itemBank provided"))
    }
    
    # Return a promise for async processing
    future_promise({
      .perform_irt_estimation(responses, items, method_in)
    }) %...>% {
      result <- .
      result
    } %...!% {
      error <- .
      res$status <- 500
      list(error = paste("Async estimation failed:", error$message))
    }
  })
  
  # ---------------------------
  # POST /irt/batch-estimate (parallel batch processing)
  # ---------------------------
  pr$handle("POST", "/irt/batch-estimate", function(req, res) {
    body <- .parse_body(req)
    if (is.null(body)) {
      res$status <- 400
      return(list(error = "Invalid JSON body"))
    }
    
    batch_data <- body$batch
    items <- body$itemBank
    method_in <- if (!is.null(body$method)) toupper(as.character(body$method)) else "EAP"
    use_callr <- if (!is.null(body$useCallr)) body$useCallr else FALSE
    
    if (is.null(batch_data) || length(batch_data) == 0) {
      res$status <- 400
      return(list(error = "No batch data provided"))
    }
    if (is.null(items) || length(items) == 0) {
      res$status <- 400
      return(list(error = "No itemBank provided"))
    }
    
    start_time <- Sys.time()
    
    # Process in parallel
    results <- .batch_estimate_parallel(batch_data, items, method_in, use_callr)
    
    end_time <- Sys.time()
    processing_time <- as.numeric(difftime(end_time, start_time, units = "secs"))
    
    # Add student IDs to results
    results_with_ids <- lapply(seq_along(batch_data), function(i) {
      c(
        list(studentId = batch_data[[i]]$studentId),
        results[[i]]
      )
    })
    
    return(list(
      batchSize = length(batch_data),
      processingTime = processing_time,
      method = ifelse(use_callr, "callr", "future"),
      results = results_with_ids
    ))
  })
  
  # ---------------------------
  # POST /irt/calibrate (original synchronous)
  # ---------------------------
  pr$handle("POST", "/irt/calibrate", function(req, res) {
    body <- .parse_body(req)
    if (is.null(body)) {
      res$status <- 400
      return(list(error = "Invalid JSON body"))
    }
    
    responses <- body$responses
    evModel <- body$evidenceModel
    
    if (is.null(responses) || length(responses) == 0) {
      res$status <- 400
      return(list(error = "No responses provided for calibration"))
    }
    if (is.null(evModel$measurementModel$irtConfig$model)) {
      res$status <- 400
      return(list(error = "Evidence Model missing irtConfig$model"))
    }
    
    return(.perform_irt_calibration(responses, evModel))
  })
  
  # ---------------------------
  # POST /irt/calibrate-async (async calibration)
  # ---------------------------
  pr$handle("POST", "/irt/calibrate-async", function(req, res) {
    body <- .parse_body(req)
    if (is.null(body)) {
      res$status <- 400
      return(list(error = "Invalid JSON body"))
    }
    
    responses <- body$responses
    evModel <- body$evidenceModel
    
    if (is.null(responses) || length(responses) == 0) {
      res$status <- 400
      return(list(error = "No responses provided for calibration"))
    }
    if (is.null(evModel$measurementModel$irtConfig$model)) {
      res$status <- 400
      return(list(error = "Evidence Model missing irtConfig$model"))
    }
    
    # Return a promise for async processing
    future_promise({
      .perform_irt_calibration(responses, evModel)
    }) %...>% {
      result <- .
      result
    } %...!% {
      error <- .
      res$status <- 500
      list(error = paste("Async calibration failed:", error$message))
    }
  })
  
  # ---------------------------
  # GET /irt/parallel-status (check parallel backend status)
  # ---------------------------
  pr$handle("GET", "/irt/parallel-status", function(req, res) {
    list(
      plan = class(plan())[1],
      workers = nbrOfWorkers(),
      available_cores = availableCores(),
      futures_running = length(futures(drop = FALSE)),
      timestamp = Sys.time()
    )
  })
  
  # ---------------------------
  # POST /irt/parallel-config (reconfigure parallel backend)
  # ---------------------------
  pr$handle("POST", "/irt/parallel-config", function(req, res) {
    body <- .parse_body(req)
    if (is.null(body)) {
      res$status <- 400
      return(list(error = "Invalid JSON body"))
    }
    
    workers <- body$workers
    if (!is.null(workers)) {
      .init_parallel(workers)
      return(list(
        message = "Parallel backend reconfigured",
        workers = nbrOfWorkers()
      ))
    }
    
    res$status <- 400
    return(list(error = "No workers parameter provided"))
  })
  
  pr
}
