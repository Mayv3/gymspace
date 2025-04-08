"use client"
import React, { createContext, useContext, useEffect, useState } from "react"

interface Plan {
  ID: string
  Tipo: string
  ["Plan o Producto"]: string
  numero_Clases: number
}

interface PlanesContextProps {
  planes: Plan[]
  fetchPlanes: () => Promise<void>
}

const PlanesContext = createContext<PlanesContextProps>({
  planes: [],
  fetchPlanes: async () => {}
})

export function PlanesProvider({ children }: { children: React.ReactNode }) {
  const [planes, setPlanes] = useState<Plan[]>([])

  async function fetchPlanes() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/planes`)
      const data = await res.json()
      setPlanes(data)
    } catch (error) {
      console.error("Error al cargar los planes", error)
    }
  }

  useEffect(() => {
    fetchPlanes()
  }, [])

  return (
    <PlanesContext.Provider value={{ planes, fetchPlanes }}>
      {children}
    </PlanesContext.Provider>
  )
}

export function usePlanes() {
  return useContext(PlanesContext)
}
