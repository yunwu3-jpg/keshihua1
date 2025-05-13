import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path"; // 需要安装 @types/node
import viteCompression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    viteCompression({
      algorithm: "gzip", // 可选 'brotliCompress'
      ext: ".gz", // 压缩后文件扩展名
      threshold: 10240, // 仅压缩大于 10KB 的文件
      deleteOriginFile: false, // 是否删除原始文件（建议保留）
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
