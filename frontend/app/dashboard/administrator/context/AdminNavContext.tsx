"use client"

import { createContext, useContext, useState } from "react"

type AdminSection =
  | "overview"
  | "members"
  | "shift-payments"
  | "assists"
  | "plans"
  | "shifts"
  | "egresos"
  | "deudas"
  | "elclub"
  | "difusion"

interface AdminNavContextType {
  section: AdminSection
  setSection: (section: AdminSection) => void
}

const AdminNavContext = createContext<AdminNavContextType | null>(null)

export function AdminNavProvider({ children }: { children: React.ReactNode }) {
  const [section, setSection] = useState<AdminSection>("overview")

  return (
    <AdminNavContext.Provider value={{ section, setSection }}>
      {children}
    </AdminNavContext.Provider>
  )
}

export function useAdminNav() {
  const ctx = useContext(AdminNavContext)
  if (!ctx) {
    throw new Error("useAdminNav debe usarse dentro de AdminNavProvider")
  }
  return ctx
}
