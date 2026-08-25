import { useState } from 'react'
import './App.css'

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-5xl font-bold text-green-400 mb-4">Sinaliza Dashboard</h1>
      <p className="text-xl text-gray-300">O painel administrativo do seu projeto está configurado!</p>
      
      <div className="mt-8 p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700 max-w-md w-full text-center">
        <h2 className="text-2xl font-semibold mb-2">Próximos Passos (Sprint 1)</h2>
        <ul className="text-left list-disc list-inside text-gray-400 mt-4 space-y-2">
          <li>Criar Tela de Login</li>
          <li>Conectar com a API do Render</li>
          <li>Montar a barra lateral (Sidebar)</li>
          <li>Puxar os dados de Ranking</li>
        </ul>
      </div>
    </div>
  )
}

export default App
