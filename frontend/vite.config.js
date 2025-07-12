import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite'


// 👇 Also use Buffer/Process fallback
export default defineConfig({
  plugins: [react(), tailwindcss()],
 
});
