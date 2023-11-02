import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        SignalEffect: resolve(__dirname, "src/SignalEffect/index.html"),
      },
    },
  },
});
