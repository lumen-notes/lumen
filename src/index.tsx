import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Layout } from "./components/layout"
import { GlobalStateProvider } from "./global-state"
import "./index.css"
import { NotePage } from "./pages/note"
import { NotesPage } from "./pages/notes"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <GlobalStateProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<NotesPage />} />
            <Route path=":id" element={<NotePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </GlobalStateProvider>
  </React.StrictMode>,
)
