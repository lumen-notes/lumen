import react from "@vitejs/plugin-react"
import jotaiDebugLabel from "jotai/babel/plugin-debug-label"
import jotaiReactRefresh from "jotai/babel/plugin-react-refresh"
import { visualizer } from "rollup-plugin-visualizer"
import { type PluginOption, defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({ babel: { plugins: [jotaiDebugLabel, jotaiReactRefresh] } }),
    visualizer({ filename: "dist/stats.html" }) as unknown as PluginOption,
  ],
})
