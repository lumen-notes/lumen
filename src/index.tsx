import * as Tooltip from "@radix-ui/react-tooltip"
import "@total-typescript/ts-reset"
import React from "react"
import ReactDOM from "react-dom/client"
import { ErrorBoundary, FallbackProps } from "react-error-boundary"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Button } from "./components/button"
import { GitHubAuth } from "./components/github-auth"
import { InsertTemplateDialog } from "./components/insert-template"
import { Markdown } from "./components/markdown"
import { NavLayout } from "./components/nav-layout"
import { NewNoteDialog } from "./components/new-note-dialog"
import { RootLayout } from "./components/root-layout"
import { ThemeColor } from "./components/theme-color"
import "./index.css"
import { CalendarPage } from "./pages/calendar"
import { FilePage } from "./pages/file"
import { NewPage } from "./pages/new"
import { NotePage } from "./pages/note"
import { NotesPage } from "./pages/notes"
import { SettingsPage } from "./pages/settings"
import { TagPage } from "./pages/tag"
import { TagsPage } from "./pages/tags"

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert" className="space-y-4 p-4">
      <Markdown>{`# Error\n\n\`\`\`\n${error.message}\n\`\`\``}</Markdown>
      <Button onClick={resetErrorBoundary}>Try again</Button>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Tooltip.Provider>
        <BrowserRouter>
          <NewNoteDialog.Provider>
            <NewNoteDialog />
            <InsertTemplateDialog />
            <ThemeColor />
            <GitHubAuth>
              <RootLayout>
                <Routes>
                  <Route path="/new" element={<NewPage />} />
                  <Route path="/file" element={<FilePage />} />
                  <Route path="/" element={<NavLayout />}>
                    <Route index element={<NotesPage />} />
                    <Route path="tags" element={<TagsPage />} />
                    <Route path="tags/*" element={<TagPage />} />
                    <Route path="calendar" element={<CalendarPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="*" element={<NotePage />} />
                  </Route>
                </Routes>
              </RootLayout>
            </GitHubAuth>
          </NewNoteDialog.Provider>
        </BrowserRouter>
      </Tooltip.Provider>
    </ErrorBoundary>
  </React.StrictMode>,
)

async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      console.log("Registering service worker…")
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
