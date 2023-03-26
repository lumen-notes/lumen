import * as Tooltip from "@radix-ui/react-tooltip"
import "@total-typescript/ts-reset"
import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { NewNoteDialog } from "./components/new-note-dialog"
import { Root } from "./components/root"
import { ThemeColor } from "./components/theme-color"
import { GlobalStateContext } from "./global-state.machine"
import "./index.css"
import { DatePage } from "./pages/date"
import { FilePage } from "./pages/file"
import { NotePage } from "./pages/note"
import { NotesPage } from "./pages/notes"
import { SettingsPage } from "./pages/settings"
import { TagPage } from "./pages/tag"
import { TagsPage } from "./pages/tags"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <GlobalStateContext.Provider>
      <Tooltip.Provider>
        <NewNoteDialog.Provider>
          <NewNoteDialog />
          <ThemeColor />
          <BrowserRouter>
            <Routes>
              <Route path="/file" element={<FilePage />} />
              <Route path="/" element={<Root />}>
                <Route index element={<NotesPage />} />
                <Route path=":id" element={<NotePage />} />
                <Route path="tags" element={<TagsPage />} />
                <Route path="tags/:name" element={<TagPage />} />
                <Route path="dates/:date" element={<DatePage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </NewNoteDialog.Provider>
      </Tooltip.Provider>
    </GlobalStateContext.Provider>
  </React.StrictMode>,
)

async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      console.log("Registering service worker...")
      const registration = await navigator.serviceWorker.register("/service-worker.js")
      console.log("Service worker registered:", registration)
    } catch (error) {
      console.error("Error during service worker registration:", error)
    }
  } else {
    console.log("Service workers not supported")
  }
}

// Register service worker in production
if (process.env.NODE_ENV === "production") {
  registerServiceWorker()
}
