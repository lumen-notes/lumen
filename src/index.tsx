import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { GlobalStateProvider } from "./global-state";
import "./index.css";
import { NotePage } from "./pages/note";
import { NotesPage } from "./pages/notes";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <GlobalStateProvider>
      <BrowserRouter>
        <Routes>
          <Route index element={<NotesPage />} />
          <Route path=":id" element={<NotePage />} />
        </Routes>
      </BrowserRouter>
    </GlobalStateProvider>
  </React.StrictMode>
);
