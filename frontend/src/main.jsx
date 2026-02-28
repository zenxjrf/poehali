import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Обработка ошибок рендеринга
if (!document.getElementById('root')) {
  console.error('Element #root not found!')
  document.body.innerHTML = '<div style="padding: 20px; text-align: center; font-family: sans-serif;"><p>Ошибка загрузки приложения</p></div>'
} else {
  try {
    const root = ReactDOM.createRoot(document.getElementById('root'))
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  } catch (error) {
    console.error('Rendering error:', error)
    document.getElementById('root').innerHTML = '<div style="padding: 20px; text-align: center; font-family: sans-serif;"><p>Ошибка загрузки приложения</p></div>'
  }
}
