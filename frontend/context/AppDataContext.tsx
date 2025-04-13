"use client"
import React, { createContext, useContext, useEffect, useState } from "react"
import dayjs from "dayjs"

interface Plan {
  ID: string
  Tipo: string
  ["Plan o Producto"]: string
  numero_Clases: number
}

interface Asistencia {
  ID: string
  Fecha: string
  ["Tipo de Clase"]: string
  ["Cantidad de presentes"]: string
  Responsable: string
}

interface AppDataContextProps {
  planes: Plan[]
  assists: Asistencia[]
  fetchPlanes: () => Promise<void>
  fetchAssists: (options: { selectedDate: Date; selectedType: string }) => Promise<void>
  setAssists: React.Dispatch<React.SetStateAction<Asistencia[]>>
  deleteAsistencia: (id: string) => Promise<void>
  editAsistencia: (id: string, nuevosDatos: Partial<Asistencia>) => Promise<void> 
}

const AppDataContext = createContext<AppDataContextProps>({
  planes: [],
  assists: [],
  fetchPlanes: async () => {},
  fetchAssists: async () => {},
  setAssists: () => {},
  deleteAsistencia: async () => {},
  editAsistencia: async () => {},
})

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [planes, setPlanes] = useState<Plan[]>([])
  const [assists, setAssists] = useState<Asistencia[]>([])

  const fetchPlanes = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/planes`)
      const data = await res.json()
      setPlanes(data)
    } catch (error) {
      console.error("Error al cargar los planes", error)
    }
  }

  const fetchAssists = async ({ selectedDate, selectedType }: { selectedDate: Date; selectedType: string }) => {
    try {
      const fechaFormateada = dayjs(selectedDate).format("YYYY-MM-DD")
      const params = new URLSearchParams({ fecha: fechaFormateada })

      if (selectedType !== "todas") {
        params.append("tipo", selectedType)
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/clases-diarias?${params.toString()}`)
      const data = await res.json()

      const formateadas = data.map((asistencia: any) => ({
        ...asistencia,
        Fecha: asistencia.Fecha,
      }))

      setAssists(formateadas)
    } catch (error) {
      console.error("Error al obtener clases diarias", error)
    }
  }

  const deleteAsistencia = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/clases-diarias/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Error al eliminar")
      }

      setAssists((prev) => prev.filter((asistencia) => asistencia.ID !== id))
    } catch (error) {
      console.error("Error al eliminar asistencia:", error)
      throw error
    }
  }

  const editAsistencia = async (id: string, nuevosDatos: Partial<Asistencia>) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/clases-diarias/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(nuevosDatos)
      })
  
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Error al editar asistencia")
      }
  
      setAssists((prev) =>
        prev.map((asistencia) =>
          asistencia.ID === id ? { ...asistencia, ...nuevosDatos } : asistencia
        )
      )
    } catch (error) {
      console.error("Error al editar asistencia:", error)
      throw error
    }
  }
  
  useEffect(() => {
    fetchPlanes()
  }, [])

  return (
    <AppDataContext.Provider
      value={{ planes, assists, fetchPlanes, fetchAssists, setAssists, deleteAsistencia, editAsistencia }}
    >
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  return useContext(AppDataContext)
}
