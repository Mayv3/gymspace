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
import { DatePicker } from "@/components/dashboard/date-picker"
import { motion } from "framer-motion"
import { UserPlus } from "lucide-react"
import axios from "axios"
import { format } from "date-fns"
import { usePlanes } from "@/context/PlanesContext" 

const formatDate = (date: Date) => format(date, "dd/MM/yyyy")

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onMemberAdded: (newMember: any) => void
}

export function AddMemberDialog({ open, onOpenChange, onMemberAdded }: AddMemberDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    dni: "",
    email: "",
    phone: "",
    sexo: "",
    plan: "",
    clasesPagadas: "0",
    clasesRealizadas: "0",
    fechaInicio: formatDate(new Date()),
    fechaVencimiento: formatDate(new Date()),
    fechaNacimiento: "",
    profesorAsignado: "",
  })

  const [errorMessage, setErrorMessage] = useState("")
  const { planes } = usePlanes() 

  const [tipoSeleccionado, setTipoSeleccionado] = useState("")
  const [planSeleccionado, setPlanSeleccionado] = useState<any>(null)

  const tiposUnicos = [...new Set(planes.map(p => p.Tipo))]
  const planesFiltrados = planes.filter(p => p.Tipo === tipoSeleccionado)

  const handleSelectPlan = (planID: string) => {
    const selected = planes.find(p => p.ID === planID)
    if (selected) {
      setPlanSeleccionado(selected)
      handleChange("plan", selected["Plan o Producto"])
      handleChange("clasesPagadas", String(selected.numero_Clases))
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const convertToISO = (dateStr: string): string => {
    const [day, month, year] = dateStr.split('/')
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  const resetForm = () => {
    setFormData({
      name: "",
      dni: "",
      email: "",
      phone: "",
      sexo: "",
      plan: "",
      clasesPagadas: "0",
      clasesRealizadas: "0",
      fechaInicio: formatDate(new Date()),
      fechaVencimiento: formatDate(new Date()),
      fechaNacimiento: "",
      profesorAsignado: "",
    })
    setTipoSeleccionado("")
    setPlanSeleccionado(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")

    const payload = {
      DNI: formData.dni,
      Nombre: formData.name,
      Email: formData.email,
      Telefono: formData.phone,
      Sexo: formData.sexo,
      Fecha_nacimiento: convertToISO(formData.fechaNacimiento),
      Plan: formData.plan,
      Clases_pagadas: parseInt(formData.clasesPagadas, 10),
      Clases_realizadas: parseInt(formData.clasesRealizadas, 10),
      Fecha_inicio: convertToISO(formData.fechaInicio),
      Fecha_vencimiento: convertToISO(formData.fechaVencimiento),
      Profesor_asignado: formData.profesorAsignado
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumnos`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      )

      resetForm()
      onOpenChange(false)
      onMemberAdded(response.data)
    } catch (error: any) {
      console.error("Error al agregar el alumno:", error)
      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message)
      } else {
        setErrorMessage("Error al agregar el alumno")
      }
    }
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[600px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5 text-primary" />
            Añadir Nuevo Miembro
          </DialogTitle>
          <DialogDescription>
            Completa el formulario para registrar un nuevo miembro en el gimnasio.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="rounded-md bg-red-100 p-2 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input id="name" placeholder="Juan Pérez" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dni">DNI/Identificación</Label>
                <Input id="dni" placeholder="12345678A" value={formData.dni} onChange={(e) => handleChange("dni", e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input id="email" type="email" placeholder="juan@ejemplo.com" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" placeholder="+34 612 345 678" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sexo">Sexo</Label>
                <Select value={formData.sexo} onValueChange={(value) => handleChange("sexo", value)}>
                  <SelectTrigger id="sexo"><SelectValue placeholder="Seleccionar sexo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Femenino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Plan</Label>
                <Select value={tipoSeleccionado} onValueChange={setTipoSeleccionado}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                  <SelectContent>
                    {tiposUnicos.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={planSeleccionado?.ID ?? ""} onValueChange={handleSelectPlan} disabled={!tipoSeleccionado}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar plan" /></SelectTrigger>
                  <SelectContent>
                    {planesFiltrados.map((plan) => (
                      <SelectItem key={plan.ID} value={plan.ID}>{plan["Plan o Producto"]} - {plan.numero_Clases} clases</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Clases Pagadas</Label>
                <Input type="number" value={formData.clasesPagadas} onChange={(e) => handleChange("clasesPagadas", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Inicio</Label>
                <DatePicker date={new Date(formData.fechaInicio.split("/").reverse().join("-"))} setDate={(date) => handleChange("fechaInicio", formatDate(date))}/>
              </div>
              <div className="space-y-2">
                <Label>Fecha de Fin</Label>
                <DatePicker date={new Date(formData.fechaVencimiento.split("/").reverse().join("-"))} setDate={(date) => handleChange("fechaVencimiento", formatDate(date))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
                <Input id="fechaNacimiento" placeholder="dd/mm/aaaa" value={formData.fechaNacimiento} onChange={(e) => handleChange("fechaNacimiento", e.target.value)} required pattern="^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/\d{4}$" title="El formato debe ser dd/mm/aaaa" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profesorAsignado">Profesor Asignado</Label>
              <Input id="profesorAsignado" placeholder="Nombre del profesor" value={formData.profesorAsignado} onChange={(e) => handleChange("profesorAsignado", e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="orange" type="submit">Registrar Miembro</Button>
            </motion.div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
