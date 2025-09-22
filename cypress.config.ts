import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    experimentalStudio: true,
    baseUrl: 'http://localhost:5173', // eller den port din Vite-app körs på
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
