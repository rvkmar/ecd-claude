import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import { installAuthFetchInterceptor } from "./api/authFetchInterceptor";
import { queryClient } from "./api/queryClient";
import { ThemeProvider } from "./theme/ThemeProvider";

// See src/api/authFetchInterceptor.js — temporary bridge so existing raw
// fetch() calls keep working now that every /api/* route requires auth.
// Phase 2 is migrating call sites off raw fetch() onto the React Query
// hooks in src/api/queries/*; this stays installed (and harmless) until
// every remaining raw fetch() site is gone, at which point this import
// and the interceptor file itself should be deleted together.
installAuthFetchInterceptor();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
