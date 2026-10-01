"use client"
import React, { createContext, useCallback, useContext, useEffect, useState } from "react"
import dayjs from "dayjs"
import { usePathname } from "next/navigation";

interface Plan {
  ID: string
  Tipo: string
  Precio: string
  ["Plan o Producto"]: string
  numero_Clases: number
  Coins: string
}
interface Asistencia {
  ID: string
  Fecha: string
  ["Tipo de Clase"]: string
  ["Cantidad de presentes"]: string
  Responsable: string
}
interface Turno {
  ID: string
  Tipo: string
  Fecha_turno: string
  Profesional: string
  Hora: string
  Responsable: string
}

interface AppDataContextProps {
  planes: Plan[]
  assists: Asistencia[]
  turnos: Turno[]
  egresos: any[]
  setEgresos: React.Dispatch<React.SetStateAction<any[]>>
  fetchPlanes: () => Promise<void>
  fetchAssists: (options: { selectedDate: Date; selectedType: string }) => Promise<void>
  setAssists: React.Dispatch<React.SetStateAction<Asistencia[]>>
  deleteAsistencia: (id: string) => Promise<void>
  editAsistencia: (id: string, nuevosDatos: Partial<Asistencia>) => Promise<void>
  // Los socios se piden paginados (useMembersList). Esto avisa a las listas que vuelvan a pedir su página
  membersVersion: number
  refreshMembers: () => void
  setPlanes: React.Dispatch<React.SetStateAction<Plan[]>>
  setTurnos: React.Dispatch<React.SetStateAction<Turno[]>>
  fetchTurnos: (selectedDate?: Date) => Promise<void>
}

const AppDataContext = createContext<AppDataContextProps>({
  planes: [],
  assists: [],
  turnos: [],
  egresos: [],
  membersVersion: 0,
  refreshMembers: () => { },
  fetchPlanes: async () => { },
  fetchAssists: async () => { },
  fetchTurnos: async () => { },
  setPlanes: () => { },
  setAssists: () => { },
  setTurnos: () => { },
  setEgresos: () => { },
  deleteAsistencia: async () => { },
  editAsistencia: async () => { },
})

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [planes, setPlanes] = useState<Plan[]>([])
  const [assists, setAssists] = useState<Asistencia[]>([])
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [egresos, setEgresos] = useState<any[]>([])
  const [membersVersion, setMembersVersion] = useState(0)
  const refreshMembers = useCallback(() => setMembersVersion(v => v + 1), [])

  const pathname = usePathname();
  const esLogin = pathname === "/login";
  const esAdmin = pathname === "/dashboard/administrator"
  const esUser = pathname === "/dashboard/member"
  const esAsistencia = pathname === "/asistencia"

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

      const fechaFormateada = selectedDate ? dayjs(selectedDate).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");
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

  const fetchTurnos = async (selectedDate?: Date) => {
    try {
      const fechaFormateada = selectedDate ? dayjs(selectedDate).format("DD/MM/YYYY") : dayjs().format("DD/MM/YYYY");
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/turnos?fecha=${fechaFormateada}`)
      const data = await res.json()
      console.log(data)
      setTurnos(data)
    } catch (error) {
      console.error("Error al obtener turnos:", error)
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

  const fetchDashboardCompleto = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dashboard/datosBase`)
    const data = await res.json()
    setPlanes(data.planes)
    setTurnos(data.turnos)
    setAssists(data.asistencias)
    setEgresos(data.egresos)
  }

  useEffect(() => {
    if (esLogin || esUser || esAsistencia) return;
    fetchDashboardCompleto();

  }, [esLogin, esAdmin])

  return (
    <AppDataContext.Provider
      value={{
        planes,
        assists,
        turnos,
        egresos,
        membersVersion,
        refreshMembers,
        fetchPlanes,
        fetchAssists,
        fetchTurnos,
        setPlanes,
        setAssists,
        setTurnos,
        setEgresos,
        deleteAsistencia,
        editAsistencia
      }}
    >
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  return useContext(AppDataContext)
}
