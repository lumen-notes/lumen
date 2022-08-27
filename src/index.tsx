import * as Tooltip from "@radix-ui/react-tooltip"
import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Root } from "./components/root"
import { GlobalStateProvider } from "./global-state"
import "./index.css"
import { DatePage } from "./pages/date"
import { NotePage } from "./pages/note"
import { NotesPage } from "./pages/notes"
import { TagPage } from "./pages/tag"
import { TagsPage } from "./pages/tags"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <GlobalStateProvider>
      <Tooltip.Provider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Root />}>
              <Route index element={<NotesPage />} />
              <Route path=":id" element={<NotePage />} />
              <Route path="tags" element={<TagsPage />} />
              <Route path="tags/:name" element={<TagPage />} />
              <Route path="dates/:date" element={<DatePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </Tooltip.Provider>
    </GlobalStateProvider>
  </React.StrictMode>,
)
