import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trophy, Star } from "lucide-react"

interface TopAlumno {
  Nombre: string
  GymCoins: number
}

interface RankingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  top10Clases: TopAlumno[];
  top10Gimnasio: TopAlumno[];
}

export function RankingDialog({
  open,
  onOpenChange,
  top10Clases,
  top10Gimnasio
}: RankingDialogProps) {
  const renderList = (list: TopAlumno[], labelKey: keyof TopAlumno, valueKey: keyof TopAlumno) => (
    <ul className="space-y-2">
      {list.map((alum, i) => (
        <li
          key={`${alum.Nombre}-${i}`}
          className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 shadow-sm hover:bg-gray-100 transition"
        >
          <div className="flex items-center gap-3">
            <span
              className={`flex items-center justify-center w-7 h-7 rounded-full text-white text-sm font-bold
                ${i === 0 ? "bg-yellow-500" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-amber-700" : "bg-orange-400"}
              `}
            >
              {i + 1}
            </span>
            <span className="font-medium">{alum[labelKey]}</span>
          </div>
          <span className="text-sm font-semibold text-orange-600">
            {alum[valueKey]}
          </span>
        </li>
      ))}
    </ul>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg justify-center font-bold">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Ranking de Alumnos
          </DialogTitle>
        </DialogHeader>

        {/* GRID: dos columnas en desktop, una en mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section>
            <h3 className="font-semibold text-gray-700 mb-2 flex items-center justify-center gap-2">
              <Star className="w-4 h-4 text-orange-500" />
              Top 10 Clases
            </h3>
            {renderList(top10Clases, "Nombre", "GymCoins")}
          </section>

          <section>
            <h3 className="font-semibold text-gray-700 mb-2 flex items-center justify-center gap-2">
              <Star className="w-4 h-4 text-orange-500" />
              Top 10 Gimnasio
            </h3>
            {renderList(top10Gimnasio, "Nombre", "GymCoins")}
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
