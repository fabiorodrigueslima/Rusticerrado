/**
 * main.jsx - Entry Point da Aplicação
 * Configuração do Vite e React
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

/**
 * Renderizar aplicação
 * Modo Strict para detectar problemas em desenvolvimento
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
