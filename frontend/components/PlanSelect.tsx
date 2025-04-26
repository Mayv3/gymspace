import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface PlanSelectProps {
  tipoPlan: string;
  setTipoPlan: (value: string) => void;
}

export function PlanSelect({ tipoPlan, setTipoPlan }: PlanSelectProps) {
  return (
    <div className="flex justify-end mb-2">
      <div className="relative w-full">
        <Button
          variant="outline"
          className={cn("w-full justify-between text-left font-normal")}
        >
          {tipoPlan === "TODOS" ? "Todos" : tipoPlan === "GIMNASIO" ? "Gimnasio" : "Clase"}
          <ChevronDown className="ml-2 h-4 w-4 text-primary" />
        </Button>
        <select
          value={tipoPlan}
          onChange={(e) => setTipoPlan(e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        >
          <option value="TODOS">Todos</option>
          <option value="GIMNASIO">Gimnasio</option>
          <option value="CLASE">Clase</option>
        </select>
      </div>
    </div>
  )
}
