"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAppData } from "@/context/AppDataContext"
import { parse, format } from "date-fns"
import { useUser } from "@/context/UserContext"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { CreditCard, DollarSign } from "lucide-react"
import { DatePicker } from "../../date-picker"

interface AddPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPaymentAdded: () => void
  onMemberUpdated: (dni: string, nuevaFecha: string, plan: string, numeroClases: number) => void
}

export function AddPaymentDialog({ open, onOpenChange, onPaymentAdded, onMemberUpdated }: AddPaymentDialogProps) {


  const [dniError, setDniError] = useState("")
  const [tipoSeleccionado, setTipoSeleccionado] = useState("")
  const [planSeleccionado, setPlanSeleccionado] = useState<any>(null)
  const { planes } = useAppData()
  const { user } = useUser()
  const [formData, setFormData] = useState({
    dni: "",
    name: "",
    amount: "",
    method: "",
    concept: "",
    paymentDate: format(new Date(), "yyyy-MM-dd"),
    expirationDate: "",
    responsable: user?.nombre,
    turno: ""
  })

  const tiposUnicos = [...new Set(planes.map(p => p.Tipo))]
  const planesFiltrados = planes.filter(p => p.Tipo === tipoSeleccionado)

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSelectPlan = (planID: string) => {
    const selected = planes.find(p => p.ID === planID)
    setPlanSeleccionado(selected)
    handleChange("amount", selected?.Precio || "")
    handleChange("concept", selected?.["Plan o Producto"] || "")
  }

  const handleDateChange = (field: "paymentDate" | "expirationDate", date: Date | undefined) => {
    if (!date) return
    const formattedDate = format(date, "yyyy-MM-dd")
    setFormData((prev) => ({ ...prev, [field]: formattedDate }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Enviando datos del formulario:", formData)
    const fields = Object.values(formData)
    if (fields.some(f => f.trim() === "")) {
      alert("Todos los campos son obligatorios")
      return
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pagos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "Socio DNI": formData.dni,
          "Nombre": formData.name,
          "Monto": formData.amount,
          "Método de Pago": formData.method,
          "Fecha de Pago": formData.paymentDate,
          "Fecha de Vencimiento": formData.expirationDate,
          "Responsable": user?.nombre,
          "Turno": formData.turno,
          "Tipo": tipoSeleccionado,
        })
      })

      const parsedDate = parse(formData.expirationDate, "yyyy-MM-dd", new Date())
      const expirationDateFormatted = format(parsedDate, "dd/MM/yyyy")

      console.log("Se actualiza el miembro con:", {
        dni: formData.dni,
        expirationDate: expirationDateFormatted,
        plan: planSeleccionado?.["Plan o Producto"],
        numeroClases: parseInt(planSeleccionado?.numero_Clases || "0")
      })

      onMemberUpdated(
        formData.dni,
        expirationDateFormatted,
        planSeleccionado?.["Plan o Producto"],
        parseInt(planSeleccionado?.numero_Clases || "0")
      )

      if (!res.ok) throw new Error("Error al registrar el pago")

      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumnos/${formData.dni}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Fecha_vencimiento: expirationDateFormatted,
          Plan: planSeleccionado?.["Plan o Producto"] || "",
          Clases_pagadas: parseInt(planSeleccionado?.numero_Clases || "0"),
          Clases_realizadas: "0"
        })
      })

      setFormData({
        dni: "",
        name: "",
        amount: "",
        method: "",
        concept: "",
        paymentDate: format(new Date(), "yyyy-MM-dd"),
        expirationDate: "",
        responsable: user?.nombre || "",
        turno: ""
      })
      setTipoSeleccionado("")
      setPlanSeleccionado(null)

      onPaymentAdded()
      onOpenChange(false)
    } catch (error) {
      console.error("Error al enviar el pago:", error)
    }
  }

  useEffect(() => {
    const fetchMember = async () => {
      if (!formData.dni) return
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumnos/${formData.dni}`)
        const data = await res.json()
        if (data && data.Nombre) {
          setFormData((prev) => ({ ...prev, name: data.Nombre }))
          setDniError("")
        } else {
          setDniError("No se encontró un alumno con ese DNI")
        }
      } catch (err) {
        setDniError("No se encontró un alumno con ese DNI")
        setFormData((prev) => ({ ...prev, name: "" }))
      }
    }
    fetchMember()
  }, [formData.dni])

  useEffect(() => {
    if (user?.nombre) {
      setFormData((prev) => ({ ...prev, responsable: user.nombre }))
    }
  }, [user])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[500px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5 text-primary" />
            Registrar Nuevo Pago
          </DialogTitle>
          <DialogDescription>Completa el formulario para registrar un nuevo pago en el sistema.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dni">DNI del Miembro</Label>
              <Input id="dni" placeholder="Ingrese el DNI del socio" value={formData.dni} onChange={(e) => handleChange("dni", e.target.value)} required />
              {dniError && <p className="text-sm text-red-600">{dniError}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Plan</Label>
                <Select value={tipoSeleccionado} onValueChange={setTipoSeleccionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposUnicos.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={planSeleccionado?.ID || ""} onValueChange={handleSelectPlan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {planesFiltrados.map((plan) => (
                      <SelectItem key={plan.ID} value={plan.ID}>{plan["Plan o Producto"]} - {plan.numero_Clases} clases</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="amount" type="number" min="0" placeholder="0.00" className="pl-8" value={formData.amount} onChange={(e) => handleChange("amount", e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Método de Pago</Label>
              <Select required value={formData.method} onValueChange={(value) => handleChange("method", value)}>
                <SelectTrigger id="method">
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Efectivo">Efectivo</SelectItem>
                  <SelectItem value="Tarjeta">Mercado Pago - otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Fecha de Pago</Label>
                <DatePicker
                  date={formData.paymentDate ? new Date(formData.paymentDate) : undefined}
                  setDate={(date) => handleDateChange("paymentDate", date)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expirationDate">Fecha de Vencimiento</Label>
                <DatePicker
                  date={formData.expirationDate ? new Date(formData.expirationDate) : undefined}
                  setDate={(date) => handleDateChange("expirationDate", date)}
                />              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="turno">Turno</Label>
              <Select required value={formData.turno} onValueChange={(value) => handleChange("turno", value)}>
                <SelectTrigger id="turno">
                  <SelectValue placeholder="Seleccionar turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mañana">Mañana</SelectItem>
                  <SelectItem value="tarde">Tarde</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsable">Responsable</Label>
              <Input
                id="responsable"
                placeholder="Nombre del recepcionista"
                value={user?.nombre}
                disabled
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="orange" type="submit">
                Registrar Pago
              </Button>
            </motion.div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}