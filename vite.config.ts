import { TanStackRouterVite } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import jotaiDebugLabel from "jotai/babel/plugin-debug-label"
import jotaiReactRefresh from "jotai/babel/plugin-react-refresh"
import { visualizer } from "rollup-plugin-visualizer"
import type { PluginOption } from "vite"
import { defineConfig } from "vite"
import { nodePolyfills } from "vite-plugin-node-polyfills"
import { VitePWA } from "vite-plugin-pwa"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react({ babel: { plugins: [jotaiDebugLabel, jotaiReactRefresh] } }),
    visualizer({ filename: "dist/stats.html" }) as unknown as PluginOption,
    // Fixes isomorphic-git Buffer error
    // https://github.com/isomorphic-git/isomorphic-git/issues/1753
    VitePWA({
      strategies: "generateSW",
      registerType: "prompt",
      injectRegister: "auto",
      manifest: {
        name: "Lumen",
        short_name: "Lumen",
        description: "A simple note-taking app for better thinking",
        theme_color: "#ffffff",
        icons: [
          {
            src: "icon-1024.png",
            sizes: "1024x1024",
            type: "image/png",
          },
        ],
        start_url: "/",
        display: "standalone",
      },
      workbox: {
        globPatterns: ["**/*.{html,css,js,woff2}"],
        ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
        skipWaiting: true,
        navigateFallback: "index.html",
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        sourcemap: true,
        // Do not cache edge function routes
        navigateFallbackDenylist: [/cors-proxy/, /git-lfs-file/, /github-auth/],
      },
      devOptions: {
        enabled: process.env.NODE_ENV === "development",
        type: "module",
      },
    }),
    nodePolyfills(),
  ],
})
