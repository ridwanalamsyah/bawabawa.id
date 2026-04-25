import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { AppRouter } from "./app/router";
import { store } from "./app/store";
import { bindApiAuthStore } from "./shared/api/client";
import { initThemeMode } from "./design-system/theme";
import "./design-system/tokens.css";

bindApiAuthStore(store);
initThemeMode();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
