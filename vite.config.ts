import { defineConfig } from 'vite'
import path from "path"
import react from '@vitejs/plugin-react-swc'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    }
  },
  server: {
    // https: {
    //   key: fs.readFileSync(path.resolve(__dirname, 'server.key')),
    //   cert: fs.readFileSync(path.resolve(__dirname, 'server.cert')),
    // },
    host: true,
    open: true
  },
  base: '/aquaops'
})
