'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import dayjs from 'dayjs'

export default function AsistenciaPage() {
  const [dni, setDni] = useState('')
  const [data, setData] = useState<any>(null)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dni) return

    if (timeoutId) clearTimeout(timeoutId)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/asistencias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni })
      })

      const result = await res.json()
      setData({ ...result, success: res.ok })

      const id = setTimeout(() => {
        setData(null)
      }, 20000)
      setTimeoutId(id)
    } catch (error) {
      console.error('Error al registrar asistencia:', error)
    }
  }

  const closeModal = () => setData(null)

  const yaRegistrado = data?.message?.toLowerCase().includes('ya registró asistencia')
  const clasesRealizadas = data?.clasesRealizadas || 0
  const clasesPagadas = data?.clasesPagadas || 1
  const porcentaje = Math.min(100, Math.round((clasesRealizadas / clasesPagadas) * 100))

  const renderIcon = () => {
    if (!data) return null
    if (yaRegistrado) return <Clock className="text-yellow-500 w-12 h-12 mb-2" />
    if (data.success) return <CheckCircle className="text-green-600 w-12 h-12 mb-2" />
    return <XCircle className="text-red-600 w-12 h-12 mb-2" />
  }

  return (
    <div className="min-h-screen bg-orange-500 flex items-center justify-center px-6 py-10 relative">
      <div className="bg-white p-10 md:p-14 rounded-3xl shadow-2xl w-full max-w-2xl">
        <div className="flex flex-col items-center mb-6">
          <img
            src="/Gymspace-logo-png.png"
            alt="Gymspace Logo"
            className="w-24 md:w-32 mb-2"
          />
          <h1
            className="text-5xl md:text-6xl font-extrabold text-center text-orange-600 tracking-wide italic"
            style={{ fontFamily: "'Ethnocentric', sans-serif" }}
          >
            GYMSPACE
          </h1>
        </div>
        <p className="text-center text-gray-600 text-lg md:text-xl mb-8">
          Ingresá tu DNI para registrar tu asistencia
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            placeholder="Ej: 45082808"
            className="w-full px-5 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
          />
          <button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 text-lg rounded-xl transition"
          >
            Registrar asistencia
          </button>
        </form>
      </div>

      {data && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center animate-fade-in-up">
            <div className='flex justify-center'>
            {renderIcon()}
            </div>
            <h2 className={`text-2xl font-bold mb-4 ${data.success ? 'text-green-700' : 'text-red-600'}`}>
              {data.message}
            </h2>

            {data.success && !yaRegistrado && (
              <>
                <div className="mb-4">
                  <p className="text-gray-700 text-lg mb-1">
                    {clasesRealizadas} de {clasesPagadas} clases realizadas
                  </p>
                  <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-orange-500 h-full transition-all duration-500"
                      style={{ width: `${porcentaje}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-left text-gray-800 space-y-2 mb-4">
                  <p><strong>Plan:</strong> {data.plan}</p>
                  <p><strong>Fecha de Vencimiento:</strong> {data.fechaVencimiento}</p>
                </div>
              </>
            )}

            <button
              onClick={closeModal}
              className="mt-4 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-xl text-lg font-semibold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
