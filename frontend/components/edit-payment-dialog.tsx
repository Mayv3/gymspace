"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
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
import { DatePicker } from "@/components/date-picker"

interface EditPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payment: any 
  onPaymentEdited: () => void
  onMemberUpdated: (dni: string, nuevaFecha: string, plan: string, numeroClases: number) => void
}

interface FormDataType {
  id: string
  dni: string
  name: string
  amount: string
  method: string
  concept: string
  paymentDate: Date | null
  expirationDate: Date | null
  responsable: string
  turno: string
}

export function EditPaymentDialog({
  open,
  onOpenChange,
  payment,
  onPaymentEdited,
  onMemberUpdated,
}: EditPaymentDialogProps) {
  const [formData, setFormData] = useState<FormDataType>({
    id: "",
    dni: "",
    name: "",
    amount: "",
    method: "",
    concept: "",
    paymentDate: null,
    expirationDate: null,
    responsable: "",
    turno: ""
  })

  const [dniError, setDniError] = useState("")
  const [planes, setPlanes] = useState<any[]>([])
  const [tipoSeleccionado, setTipoSeleccionado] = useState("")
  const [planSeleccionado, setPlanSeleccionado] = useState<any>(null)

  useEffect(() => {
    if (payment) {
      setFormData({
        id: payment.ID || "",
        dni: payment["Socio DNI"] || "",
        name: payment.Nombre || "",
        amount: payment.Monto || "",
        method: payment.Metodo_de_Pago || "",
        concept: payment.Concepto || "",
        paymentDate: payment.Fecha_de_Pago ? new Date(payment.Fecha_de_Pago) : null,
        expirationDate: payment.Fecha_de_Vencimiento ? new Date(payment.Fecha_de_Vencimiento) : null,
        responsable: payment.Responsable || "",
        turno: payment.Turno || ""
      })
    }
  }, [payment])
  
  useEffect(() => {
    const fetchPlanes = async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/planes`)
      const data = await res.json()
      setPlanes(data)
    }
    fetchPlanes()
  }, [])

  const tiposUnicos = [...new Set(planes.map(p => p.Tipo))]
  const planesFiltrados = planes.filter(p => p.Tipo === tipoSeleccionado)

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

  const handleChange = (field: keyof FormDataType, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleChangeDate = (field: "paymentDate" | "expirationDate", date: Date | null) => {
    setFormData((prev) => ({ ...prev, [field]: date }))
  }

  const handleSelectPlan = (planID: string) => {
    const selected = planes.find(p => p.ID === planID)
    setPlanSeleccionado(selected)
    handleChange("amount", selected?.Precio || "")
    handleChange("concept", selected?.["Plan o Producto"] || "")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.dni.trim() ||
      !formData.name.trim() ||
      !formData.amount.trim() ||
      !formData.method.trim() ||
      !formData.concept.trim() ||
      !formData.responsable.trim() ||
      !formData.turno.trim() ||
      !formData.paymentDate ||
      !formData.expirationDate
    ) {
      alert("Todos los campos son obligatorios")
      return
    }

    const fechaPagoFormateada = format(formData.paymentDate, "dd/MM/yyyy")
    const fechaVencimientoFormateada = format(formData.expirationDate, "dd/MM/yyyy")

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pagos/${formData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "Socio DNI": formData.dni,
          "Nombre": formData.name,
          "Monto": formData.amount,
          "Método de Pago": formData.method,
          "Fecha de Pago": fechaPagoFormateada,
          "Fecha de Vencimiento": fechaVencimientoFormateada,
          "Responsable": formData.responsable,
          "Turno": formData.turno,
          "Concepto": formData.concept
        })
      })

      if (!res.ok) throw new Error("Error al editar el pago")

      onMemberUpdated(
        formData.dni,
        fechaVencimientoFormateada,
        planSeleccionado?.["Plan o Producto"] || "",
        parseInt(planSeleccionado?.numero_Clases || "0")
      )

      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumnos/${payment["Socio DNI"]}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Fecha_vencimiento: fechaVencimientoFormateada,
          Plan: planSeleccionado?.["Plan o Producto"] || "",
          Clases_pagadas: parseInt(planSeleccionado?.numero_Clases || "0"),
          Clases_realizadas: "0"
        })
      })

      onPaymentEdited()
      onOpenChange(false)
    } catch (error) {
      console.error("Error al editar el pago:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[500px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5 text-primary" />
            Editar Pago
          </DialogTitle>
          <DialogDescription>Modifica los datos del pago seleccionado.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* DNI: se muestra pero no es editable */}
            <div className="space-y-2">
              <Label htmlFor="dni">DNI del Miembro</Label>
              <Input
                id="dni"
                placeholder="Ingrese el DNI del socio"
                value={formData.dni}
                onChange={(e) => handleChange("dni", e.target.value)}
                disabled
              />
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
                      <SelectItem key={plan.ID} value={plan.ID}>
                        {plan["Plan o Producto"]} - {plan.numero_Clases} clases
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  placeholder="0.00"
                  className="pl-8"
                  value={formData.amount}
                  onChange={(e) => handleChange("amount", e.target.value)}
                  required
                />
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
                  <SelectItem value="Tarjeta de Crédito">Tarjeta de Crédito</SelectItem>
                  <SelectItem value="Tarjeta de Débito">Tarjeta de Débito</SelectItem>
                  <SelectItem value="Transferencia Bancaria">Transferencia Bancaria</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Pago</Label>
                <DatePicker date={formData.paymentDate || undefined} setDate={(date) => handleChangeDate("paymentDate", date)} />
              </div>
              <div className="space-y-2">
                <Label>Fecha de Vencimiento</Label>
                <DatePicker date={formData.expirationDate || undefined} setDate={(date) => handleChangeDate("expirationDate", date)} />
              </div>
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
                value={formData.responsable}
                onChange={(e) => handleChange("responsable", e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="orange" type="submit">
                Editar Pago
              </Button>
            </motion.div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
