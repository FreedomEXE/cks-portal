// vite.config.ts
import { defineConfig } from "file:///C:/Users/User/Documents/GitHub/cks-portal/node_modules/.pnpm/vite@5.4.20_@types+node@20.19.14/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/User/Documents/GitHub/cks-portal/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.20_@types+node@20.19.14_/node_modules/@vitejs/plugin-react/dist/index.js";
import dts from "file:///C:/Users/User/Documents/GitHub/cks-portal/node_modules/.pnpm/vite-plugin-dts@3.9.1_@type_12afe60147050fb93de6d3bd3b8d4b6d/node_modules/vite-plugin-dts/dist/index.mjs";
import { resolve } from "path";
var __vite_injected_original_dirname = "C:\\Users\\User\\Documents\\GitHub\\cks-portal\\auth";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    dts({
      entryRoot: "src",
      tsConfigFilePath: "./tsconfig.json",
      skipDiagnostics: false
    })
  ],
  build: {
    lib: {
      entry: resolve(__vite_injected_original_dirname, "src/index.ts"),
      name: "Auth",
      formats: ["es"],
      fileName: "index"
    },
    rollupOptions: {
      external: ["react", "react-dom", "react-router-dom", "@clerk/clerk-react"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react-router-dom": "ReactRouterDOM",
          "@clerk/clerk-react": "ClerkReact"
        },
        assetFileNames: (assetInfo) => {
          if (/\.css$/.test(assetInfo.name ?? "")) return "style.css";
          return "assets/[name]-[hash][extname]";
        }
      }
    },
    cssCodeSplit: false,
    // Bundle all CSS into style.css
    emptyOutDir: true
  },
  resolve: {
    alias: {
      "@": resolve(__vite_injected_original_dirname, "src")
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxVc2VyXFxcXERvY3VtZW50c1xcXFxHaXRIdWJcXFxcY2tzLXBvcnRhbFxcXFxhdXRoXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxVc2VyXFxcXERvY3VtZW50c1xcXFxHaXRIdWJcXFxcY2tzLXBvcnRhbFxcXFxhdXRoXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9Vc2VyL0RvY3VtZW50cy9HaXRIdWIvY2tzLXBvcnRhbC9hdXRoL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XHJcbmltcG9ydCBkdHMgZnJvbSAndml0ZS1wbHVnaW4tZHRzJztcclxuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbXHJcbiAgICByZWFjdCgpLFxyXG4gICAgZHRzKHtcclxuICAgICAgZW50cnlSb290OiAnc3JjJyxcclxuICAgICAgdHNDb25maWdGaWxlUGF0aDogJy4vdHNjb25maWcuanNvbicsXHJcbiAgICAgIHNraXBEaWFnbm9zdGljczogZmFsc2UsXHJcbiAgICB9KSxcclxuICBdLFxyXG4gIGJ1aWxkOiB7XHJcbiAgICBsaWI6IHtcclxuICAgICAgZW50cnk6IHJlc29sdmUoX19kaXJuYW1lLCAnc3JjL2luZGV4LnRzJyksXHJcbiAgICAgIG5hbWU6ICdBdXRoJyxcclxuICAgICAgZm9ybWF0czogWydlcyddLFxyXG4gICAgICBmaWxlTmFtZTogJ2luZGV4JyxcclxuICAgIH0sXHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIGV4dGVybmFsOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJywgJ0BjbGVyay9jbGVyay1yZWFjdCddLFxyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICBnbG9iYWxzOiB7XHJcbiAgICAgICAgICByZWFjdDogJ1JlYWN0JyxcclxuICAgICAgICAgICdyZWFjdC1kb20nOiAnUmVhY3RET00nLFxyXG4gICAgICAgICAgJ3JlYWN0LXJvdXRlci1kb20nOiAnUmVhY3RSb3V0ZXJET00nLFxyXG4gICAgICAgICAgJ0BjbGVyay9jbGVyay1yZWFjdCc6ICdDbGVya1JlYWN0JyxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiAoYXNzZXRJbmZvKSA9PiB7XHJcbiAgICAgICAgICBpZiAoL1xcLmNzcyQvLnRlc3QoYXNzZXRJbmZvLm5hbWUgPz8gJycpKSByZXR1cm4gJ3N0eWxlLmNzcyc7XHJcbiAgICAgICAgICByZXR1cm4gJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdW2V4dG5hbWVdJztcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIGNzc0NvZGVTcGxpdDogZmFsc2UsIC8vIEJ1bmRsZSBhbGwgQ1NTIGludG8gc3R5bGUuY3NzXHJcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcclxuICB9LFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgICdAJzogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMnKSxcclxuICAgIH0sXHJcbiAgfSxcclxufSk7Il0sCiAgIm1hcHBpbmdzIjogIjtBQUEwVSxTQUFTLG9CQUFvQjtBQUN2VyxPQUFPLFdBQVc7QUFDbEIsT0FBTyxTQUFTO0FBQ2hCLFNBQVMsZUFBZTtBQUh4QixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixJQUFJO0FBQUEsTUFDRixXQUFXO0FBQUEsTUFDWCxrQkFBa0I7QUFBQSxNQUNsQixpQkFBaUI7QUFBQSxJQUNuQixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsS0FBSztBQUFBLE1BQ0gsT0FBTyxRQUFRLGtDQUFXLGNBQWM7QUFBQSxNQUN4QyxNQUFNO0FBQUEsTUFDTixTQUFTLENBQUMsSUFBSTtBQUFBLE1BQ2QsVUFBVTtBQUFBLElBQ1o7QUFBQSxJQUNBLGVBQWU7QUFBQSxNQUNiLFVBQVUsQ0FBQyxTQUFTLGFBQWEsb0JBQW9CLG9CQUFvQjtBQUFBLE1BQ3pFLFFBQVE7QUFBQSxRQUNOLFNBQVM7QUFBQSxVQUNQLE9BQU87QUFBQSxVQUNQLGFBQWE7QUFBQSxVQUNiLG9CQUFvQjtBQUFBLFVBQ3BCLHNCQUFzQjtBQUFBLFFBQ3hCO0FBQUEsUUFDQSxnQkFBZ0IsQ0FBQyxjQUFjO0FBQzdCLGNBQUksU0FBUyxLQUFLLFVBQVUsUUFBUSxFQUFFLEVBQUcsUUFBTztBQUNoRCxpQkFBTztBQUFBLFFBQ1Q7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsY0FBYztBQUFBO0FBQUEsSUFDZCxhQUFhO0FBQUEsRUFDZjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxRQUFRLGtDQUFXLEtBQUs7QUFBQSxJQUMvQjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
