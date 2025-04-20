import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { motion } from "framer-motion"
import { useUser } from "@/context/UserContext"

interface RegisterClassDialogProps {
  open: boolean
  onOpenChange: (value: boolean) => void
}

const tiposDeClase = ["Funcional", "Tela", "Acrobacia", "Yoga", "Cross"]

export default function RegisterClassDialog({ open, onOpenChange }: RegisterClassDialogProps) {
  const [formData, setFormData] = useState({ tipoClase: "", cantidadPersonas: "", responsable: "DANI" })
  const { user } = useUser()

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/clases-diarias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error("Error al registrar clase")

      onOpenChange(false)
      setFormData({ tipoClase: "", cantidadPersonas: "", responsable: user?.nombre || "" })
    } catch (error) {
      console.error("Error al registrar clase diaria:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Presentes</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Clase</Label>
            <Select value={formData.tipoClase} onValueChange={(value) => handleChange("tipoClase", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar clase" />
              </SelectTrigger>
              <SelectContent>
                {tiposDeClase.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Cantidad de Personas</Label>
            <Input
              type="number"
              max={40}
              value={formData.cantidadPersonas}
              onChange={(e) => handleChange("cantidadPersonas", e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="orange" type="submit">Registrar</Button>
            </motion.div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
