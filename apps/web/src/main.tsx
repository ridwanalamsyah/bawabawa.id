import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import { AppRouter } from "./app/router";
import { store } from "./app/store";
import { bindApiAuthStore } from "./shared/api/client";
import { initThemeMode } from "./design-system/theme";
import { CmsProvider } from "./features/cms/CmsContext";
import "./design-system/tokens.css";

bindApiAuthStore(store);
initThemeMode();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <CmsProvider>
          <AppRouter />
        </CmsProvider>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: "var(--glass-bg-deep)",
              border: "1px solid var(--glass-border-strong)",
              color: "var(--color-text)",
              boxShadow: "var(--glass-shadow-lg)",
              backdropFilter: "blur(20px)"
            }
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
