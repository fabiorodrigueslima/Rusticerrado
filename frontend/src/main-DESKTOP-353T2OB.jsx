/**
 * main.jsx - Entry Point da Aplicação
 * Configuração do Vite e React
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Fontes da RustiCerrado (ficam dentro do site, funcionam em qualquer celular)
import '@fontsource-variable/source-sans-3'
import '@fontsource/zilla-slab/600.css'
import '@fontsource/zilla-slab/700.css'

/**
 * Renderizar aplicação
 * Modo Strict para detectar problemas em desenvolvimento
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
