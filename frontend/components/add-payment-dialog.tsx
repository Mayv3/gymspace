"use client"

import type React from "react"

import { useState, useEffect } from "react"
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

interface AddPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPaymentAdded: () => void
}

export function AddPaymentDialog({ open, onOpenChange, onPaymentAdded }: AddPaymentDialogProps) {
  const [formData, setFormData] = useState({
    dni: "",
    name: "",
    amount: "",
    method: "",
    concept: "",
    paymentDate: "",
    expirationDate: "",
    responsable: "",
    turno: ""
  })
  const [dniError, setDniError] = useState("")

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

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.dni || !formData.name || !formData.amount || !formData.method || !formData.concept || !formData.paymentDate || !formData.expirationDate || !formData.responsable || !formData.turno) {
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
          "Responsable": formData.responsable,
          "Turno": formData.turno
        })
      })

      if (!res.ok) throw new Error("Error al registrar el pago")

      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumnos/${formData.dni}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Fecha_vencimiento: formData.expirationDate
        })
      })
      onPaymentAdded();
      onOpenChange(false)
    } catch (error) {
      console.error("Error al enviar el pago:", error)
    }
  }

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
              <Input
                id="dni"
                placeholder="Ingrese el DNI del socio"
                value={formData.dni}
                onChange={(e) => handleChange("dni", e.target.value)}
                required
              />
              {dniError && <p className="text-sm text-red-600">{dniError}</p>}
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
            <div className="space-y-2">
              <Label htmlFor="concept">Concepto</Label>
              <Select required value={formData.concept} onValueChange={(value) => handleChange("concept", value)}>
                <SelectTrigger id="concept">
                  <SelectValue placeholder="Seleccionar concepto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mensualidad Básica">Mensualidad Básica</SelectItem>
                  <SelectItem value="Mensualidad Estándar">Mensualidad Estándar</SelectItem>
                  <SelectItem value="Mensualidad Premium">Mensualidad Premium</SelectItem>
                  <SelectItem value="Entrenamiento Personal">Entrenamiento Personal</SelectItem>
                  <SelectItem value="Consulta Nutrición">Consulta Nutrición</SelectItem>
                  <SelectItem value="Merchandising">Merchandising</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Fecha de Pago</Label>
                <Input
                  type="date"
                  id="paymentDate"
                  value={formData.paymentDate}
                  onChange={(e) => handleChange("paymentDate", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expirationDate">Fecha de Vencimiento</Label>
                <Input
                  type="date"
                  id="expirationDate"
                  value={formData.expirationDate}
                  onChange={(e) => handleChange("expirationDate", e.target.value)}
                  required
                />
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
                Registrar Pago
              </Button>
            </motion.div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}