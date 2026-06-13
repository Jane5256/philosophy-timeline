import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' → 相对路径，使站点在任意路径下都能正确加载资源
// （GitHub Pages 子路径 /philosophy-timeline/、Netlify 根路径、本地预览都通用；无客户端路由所以安全）
// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
})
