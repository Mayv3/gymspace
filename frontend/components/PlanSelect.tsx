import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface PlanSelectProps {
  tipoPlan: string;
  setTipoPlan: (value: string) => void;
}

export function PlanSelect({ tipoPlan, setTipoPlan }: PlanSelectProps) {
  return (
    <div className="mb-2">
      <Select value={tipoPlan} onValueChange={setTipoPlan}>
        <SelectTrigger className="w-full border rounded-md bg-white text-black border-zinc-300 dark:bg-zinc-900 dark:text-white dark:border-zinc-700">
          <SelectValue placeholder="Seleccionar plan" />
        </SelectTrigger>
        <SelectContent className="bg-white text-black border border-zinc-300 dark:bg-zinc-900 dark:text-white dark:border-zinc-700">
          <SelectItem value="TODOS">Todos</SelectItem>
          <SelectItem value="GIMNASIO">Gimnasio</SelectItem>
          <SelectItem value="CLASE">Clase</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
