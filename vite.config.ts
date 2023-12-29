import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "lib/index.ts"),
        subscribeEvents: resolve(__dirname, "lib/SubscribeEvents.ts"),
        signalEffect: resolve(__dirname, "lib/SignalEffect.ts"),
        signalI18n: resolve(__dirname, "lib/SignalI18n.ts"),
        reactiveConstant: resolve(__dirname, "lib/ReactiveConstant.ts"),
      },
      name: "GPL",
    },
  },
});
