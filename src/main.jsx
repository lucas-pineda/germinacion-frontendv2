import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { GreenhouseProvider } from './context/GreenhouseContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GreenhouseProvider>
      <App />
    </GreenhouseProvider>
  </React.StrictMode>,
)