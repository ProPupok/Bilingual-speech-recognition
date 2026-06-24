import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '')

  const isHttps = env.VITE_HTTPS === 'true'
  const backendUrl = env.VITE_API_URL || 'https://192.168.56.1:8000'

  return {
    plugins: [
      react(),
      ...(isHttps ? [basicSsl()] : [])
    ],
    envDir: '../',
    server: {
      https: isHttps,
      port: 5173,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          ws: true
        }
      }
    }
  }
})


//import { defineConfig, loadEnv } from 'vite'
//import react from '@vitejs/plugin-react'
//import basicSsl from '@vitejs/plugin-basic-ssl'
//
//export default defineConfig(({ mode }) => {
//  const env = loadEnv(mode, '../', '')
//
//  const isHttps = env.VITE_HTTPS === 'true'
//
//  return {
//    plugins: [
//      react(),
//      ...(isHttps ? [basicSsl()] : [])
//    ],
//    envDir: '../',
//    server: {
//      https: isHttps,
//      port: 5173
//    }
//  }
//})