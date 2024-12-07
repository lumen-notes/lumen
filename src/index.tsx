import * as Tooltip from "@radix-ui/react-tooltip"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import "@total-typescript/ts-reset"
import { StrictMode } from "react"
import ReactDOM from "react-dom/client"
import { routeTree } from "./routeTree.gen"
import "./styles/index.css"

// Create a new router instance
const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}



// Render the app
const rootElement = document.getElementById("root")!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
        <Tooltip.Provider>
          <RouterProvider router={router} />
        </Tooltip.Provider>
    </StrictMode>,
  )
}

// import React from "react"
// import ReactDOM from "react-dom/client"
// import { BrowserRouter, Route, Routes } from "react-router-dom"
// import { Button } from "./components/button"
// import { Markdown } from "./components/markdown"
// // import { NavLayout } from "./components/nav-layout"
// import { RootLayout } from "./components/root-layout"
// import { FilePage } from "./pages-old/file"
// import { NotePage } from "./pages-old/note"
// import { NotesPage } from "./pages-old/notes"
// import { SettingsPage } from "./pages-old/settings"
// import { TagPage } from "./pages-old/tag"
// import { TagsPage } from "./pages-old/tags"
// import "./styles/index.css"

// function App() {
//   return (
//     <React.StrictMode>
//       <ErrorBoundary FallbackComponent={ErrorFallback}>
//         <Tooltip.Provider>
//           <div>Hello</div>
//         </Tooltip.Provider>
//       </ErrorBoundary>
//     </React.StrictMode>
//   )
// }

// ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<App />)

// ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
//   <React.StrictMode>
//     <ErrorBoundary FallbackComponent={ErrorFallback}>
//       <Tooltip.Provider>
//         <BrowserRouter>
//           <RootLayout>
//             <Routes>
//               {/* <Route path="/" element={<NavLayout />}> */}
//               <Route index element={<NotesPage />} />
//               <Route path="tags" element={<TagsPage />} />
//               <Route path="tags/*" element={<TagPage />} />
//               <Route path="file" element={<FilePage />} />
//               <Route path="settings" element={<SettingsPage />} />
//               <Route path="*" element={<NotePage />} />
//               {/* </Route> */}
//             </Routes>
//           </RootLayout>
//         </BrowserRouter>
//       </Tooltip.Provider>
//     </ErrorBoundary>
//   </React.StrictMode>,
// )
