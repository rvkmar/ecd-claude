# api.R
# Enhanced API server with parallel computing support

# Load required libraries for parallel computing
library(future)
library(promises)
library(callr)

# Configure future plan for API server
# This ensures promises work correctly with plumber
plan(multisession, workers = max(2, availableCores() - 1))

# Source the enhanced IRT module
source("/home/app/modules/irt.R")

# Create the API instance
api <- irt_api()

# Configure plumber for async support
api$registerHooks(
  list(
    preroute = function() {
      # Enable CORS if needed
      res$setHeader("Access-Control-Allow-Origin", "*")
    },
    postroute = function(req, res, value) {
      # Handle promises properly
      if (promises::is.promise(value)) {
        value
      } else {
        value
      }
    }
  )
)

# Optional: Add a health check endpoint
api$handle("GET", "/health", function() {
  list(
    status = "healthy",
    timestamp = Sys.time(),
    parallel = list(
      plan = class(plan())[1],
      workers = nbrOfWorkers()
    )
  )
})

# Start the server on port 4000
api$run(
  host = "0.0.0.0",
  port = 4000,
  swagger = FALSE  # Set to TRUE if you want Swagger docs
)

# The server will run and display:
# Running plumber API at http://0.0.0.0:4000
# Parallel backend initialized with N workers