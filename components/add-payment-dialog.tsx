"use client"

import type React from "react"

import { useState } from "react"
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
import { DatePicker } from "@/components/date-picker"
import { motion } from "framer-motion"
import { CreditCard, DollarSign } from "lucide-react"
import { mockMembers } from "@/lib/mock-data"

interface AddPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddPaymentDialog({ open, onOpenChange }: AddPaymentDialogProps) {
  const [formData, setFormData] = useState({
    member: "",
    amount: "",
    method: "",
    concept: "",
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí iría la lógica para añadir el pago
    console.log("Nuevo pago:", formData)
    onOpenChange(false)
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="member">Miembro</Label>
                <Select value={formData.member} onValueChange={(value) => handleChange("member", value)}>
                  <SelectTrigger id="member">
                    <SelectValue placeholder="Seleccionar miembro" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} ({member.dni})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="method">Método de Pago</Label>
                <Select value={formData.method} onValueChange={(value) => handleChange("method", value)}>
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
                <Select value={formData.concept} onValueChange={(value) => handleChange("concept", value)}>
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
            </div>
            <div className="space-y-2">
              <Label>Fecha de Pago</Label>
              <DatePicker />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas de Pago</Label>
              <Input id="notes" placeholder="Cualquier nota sobre este pago" />
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

