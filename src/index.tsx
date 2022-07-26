import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./components/app";
import { GlobalStateProvider } from "./global-state";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <GlobalStateProvider>
      <App />
    </GlobalStateProvider>
  </React.StrictMode>
);
