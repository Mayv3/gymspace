'use client'

import { useState } from 'react'

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


    const yaRegistrado = data?.message?.toLowerCase().includes('ya registró asistencia')
    const clasesRealizadas = data?.clasesRealizadas || 0
    const clasesPagadas = data?.clasesPagadas || 1 // Evitamos división por cero
    const porcentaje = Math.min(100, Math.round((clasesRealizadas / clasesPagadas) * 100))

    return (
        <div className="min-h-screen bg-orange-500 flex items-center justify-center px-6 py-10">
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

                {data && (
                    <div className="mt-8 p-6 rounded-2xl bg-gray-100 shadow-inner">
                        <p className={`text-xl text-center font-semibold ${data.success ? 'text-green-700' : 'text-red-600'}`}>
                            {data.message}
                        </p>

                        {data.success && !yaRegistrado && (
                            <div className="mt-4 space-y-4">
                                <div>
                                    <p className="text-lg font-medium text-gray-700">
                                        {clasesRealizadas} de {clasesPagadas} clases
                                    </p>
                                    <div className="w-full bg-gray-300 rounded-full h-4 mt-1 overflow-hidden">
                                        <div
                                            className="bg-orange-500 h-full transition-all duration-500"
                                            style={{ width: `${porcentaje}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-lg text-gray-800">
                                        <strong>Plan:</strong> {data.plan}
                                    </p>
                                    <p className="text-lg text-gray-800">
                                        <strong>Fecha de Vencimiento:</strong> {data.fechaVencimiento}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
