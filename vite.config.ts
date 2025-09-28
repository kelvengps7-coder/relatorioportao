import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Adiciona o plugin visualizer, que será executado ao criar o build
    visualizer({
      filename: "stats.html", // Nome do arquivo de saída do relatório
      open: true, // Abre o relatório automaticamente no navegador após o build
      gzipSize: true, // Mostra o tamanho dos arquivos após a compressão gzip
      brotliSize: true, // Mostra o tamanho após a compressão brotli (mais eficiente)
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
