import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface RankingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  top10Clases: any[];
  top10Gimnasio: any[];
}

export function RankingDialog({
  open,
  onOpenChange,
  top10Clases,
  top10Gimnasio
}: RankingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ranking de Alumnos</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <section>
            <h3 className="font-semibold">Top 10 Clases</h3>
            <ol className="list-decimal pl-6">
              {top10Clases.map((alum, i) => (
                <li key={i}>
                  {alum.Nombre} – {alum.GymCoins ?? alum.CantidadClases}
                </li>
              ))}
            </ol>
          </section>
          <section>
            <h3 className="font-semibold">Top 10 Gimnasio</h3>
            <ol className="list-decimal pl-6">
              {top10Gimnasio.map((alum, i) => (
                <li key={i}>
                  {alum.Nombre} – {alum.GymCoins ?? alum.Asistencias}
                </li>
              ))}
            </ol>
          </section>
        </div>
        <DialogFooter>
          <Button variant="orange" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
