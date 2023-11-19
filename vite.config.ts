import react from "@vitejs/plugin-react"
import jotaiDebugLabel from "jotai/babel/plugin-debug-label"
import jotaiReactRefresh from "jotai/babel/plugin-react-refresh"
import { visualizer } from "rollup-plugin-visualizer"
import { defineConfig, type PluginOption } from "vite"
import { nodePolyfills } from "vite-plugin-node-polyfills"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({ babel: { plugins: [jotaiDebugLabel, jotaiReactRefresh] } }),
    visualizer({ filename: "dist/stats.html" }) as unknown as PluginOption,
    // Fixes isomorphic-git Buffer error
    // https://github.com/isomorphic-git/isomorphic-git/issues/1753
    nodePolyfills(),
  ],
})
