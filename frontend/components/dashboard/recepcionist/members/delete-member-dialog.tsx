import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import axios from "axios"

interface DeleteMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: any // El miembro a eliminar, se espera que tenga el campo DNI
  onDelete: (deletedMemberDNI: string) => void
}

export function DeleteMemberDialog({ open, onOpenChange, member, onDelete }: DeleteMemberDialogProps) {
  const handleDelete = async () => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumnos/${member.DNI}`)
      // Se notifica al componente padre que se eliminó el miembro
      onDelete(member.DNI)
      onOpenChange(false)
    } catch (error) {
      console.error("Error al eliminar el miembro", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirmar Eliminación</DialogTitle>
          <DialogDescription>
            ¿Está seguro de que desea eliminar este usuario? Esta acción es permanente.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
