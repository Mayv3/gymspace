"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import axios from "axios"
import { DatePicker } from "@/components/date-picker"
import { format } from "date-fns"

export function EditMemberDialog({ open, onOpenChange, member, onSave }: any) {
  const [editedMember, setEditedMember] = useState(member || {})

  useEffect(() => {
    // Cada vez que cambie 'member', lo convertimos a dd/mm/yyyy si viene en ISO
    if (member) {
      const converted = { ...member }

      // Si la fecha viene en formato ISO (yyyy-mm-dd), la convertimos a dd/mm/yyyy
      if (converted.Fecha_nacimiento && converted.Fecha_nacimiento.includes("-")) {
        const [year, month, day] = converted.Fecha_nacimiento.split("-")
        converted.Fecha_nacimiento = `${day}/${month}/${year}`
      }

      setEditedMember(converted)
    }
  }, [member])

  const handleChange = (field: string, value: string) => {
    setEditedMember((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    // Creamos el payload a partir de editedMember
    const payload = { ...editedMember }

    // Convertimos 'Fecha_nacimiento' de dd/mm/yyyy a yyyy-mm-dd si coincide con el patrón
    if (payload.Fecha_nacimiento && payload.Fecha_nacimiento.includes("/")) {
      const [day, month, year] = payload.Fecha_nacimiento.split("/")
      payload.Fecha_nacimiento = `${year}-${month}-${day}`
    }

    try {
      const response = await axios.put(
        `http://localhost:3001/api/alumnos/${payload.DNI}`,
        {
          Nombre: payload.Nombre,
          Email: payload.Email,
          Telefono: payload.Telefono,
          Sexo: payload.Sexo,
          Fecha_nacimiento: payload.Fecha_nacimiento, // ya convertido a ISO
          Plan: payload.Plan,
          Clases_pagadas: payload.Clases_pagadas,
          Clases_realizadas: payload.Clases_realizadas,
          Fecha_inicio: payload.Fecha_inicio,
          Fecha_vencimiento: payload.Fecha_vencimiento,
          Profesor_asignado: payload.Profesor_asignado,
        },
        { headers: { "Content-Type": "application/json" } }
      )
      console.log("Miembro actualizado:", response.data)
      onSave(payload)
      onOpenChange(false)
    } catch (error) {
      console.error("Error actualizando el miembro", error)
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Miembro</DialogTitle>
          <DialogDescription>Modifica la información del socio.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Fila 1: Nombre y DNI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="Nombre">Nombre</Label>
              <Input
                id="Nombre"
                value={editedMember.Nombre || ""}
                onChange={(e) => handleChange("Nombre", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="DNI">DNI</Label>
              <Input
                id="DNI"
                value={editedMember.DNI || ""}
                onChange={(e) => handleChange("DNI", e.target.value)}
                disabled
              />
            </div>
          </div>

          {/* Fila 2: Email, Teléfono y Sexo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="Email">Email</Label>
              <Input
                id="Email"
                value={editedMember.Email || ""}
                onChange={(e) => handleChange("Email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Telefono">Teléfono</Label>
              <Input
                id="Telefono"
                value={editedMember.Telefono || ""}
                onChange={(e) => handleChange("Telefono", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Sexo">Sexo</Label>
              <Input
                id="Sexo"
                placeholder="M o F"
                value={editedMember.Sexo || ""}
                onChange={(e) => handleChange("Sexo", e.target.value)}
              />
            </div>
          </div>

          {/* Fila 3: Clases Pagadas y Clases Realizadas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="Clases_pagadas">Clases Pagadas</Label>
              <Input
                id="Clases_pagadas"
                value={editedMember.Clases_pagadas || ""}
                onChange={(e) => handleChange("Clases_pagadas", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Clases_realizadas">Clases Realizadas</Label>
              <Input
                id="Clases_realizadas"
                value={editedMember.Clases_realizadas || ""}
                onChange={(e) => handleChange("Clases_realizadas", e.target.value)}
              />
            </div>
          </div>

          {/* Fila 4: Fecha de Inicio y Fecha de Vencimiento con DatePicker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha de Inicio</Label>
              <DatePicker
                date={editedMember.Fecha_inicio ? new Date(editedMember.Fecha_inicio) : new Date()}
                setDate={(newDate: Date) =>
                  // Actualiza el campo con formato ISO ("yyyy-MM-dd")
                  handleChange("Fecha_inicio", format(newDate, "yyyy-MM-dd"))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha de Vencimiento</Label>
              <DatePicker
                date={editedMember.Fecha_vencimiento ? new Date(editedMember.Fecha_vencimiento) : new Date()}
                setDate={(newDate: Date) =>
                  handleChange("Fecha_vencimiento", format(newDate, "yyyy-MM-dd"))
                }
              />
            </div>
          </div>

          {/* Fila 5: Fecha de Nacimiento y Plan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="Fecha_nacimiento">Fecha de Nacimiento</Label>
              <Input
                id="Fecha_nacimiento"
                value={editedMember.Fecha_nacimiento || ""}
                onChange={(e) => handleChange("Fecha_nacimiento", e.target.value)}
                required
                pattern="^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/\d{4}$"
                title="El formato debe ser dd/mm/aaaa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="Plan">Plan</Label>
              <Input
                id="Plan"
                value={editedMember.Plan || ""}
                onChange={(e) => handleChange("Plan", e.target.value)}
              />
            </div>
          </div>


          {/* Fila 6: Profesor Asignado */}
          <div className="space-y-2">
            <Label htmlFor="Profesor_asignado">Profesor Asignado</Label>
            <Input
              id="Profesor_asignado"
              value={editedMember.Profesor_asignado || ""}
              onChange={(e) => handleChange("Profesor_asignado", e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button variant="orange" onClick={handleSave}>
              Guardar Cambios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
