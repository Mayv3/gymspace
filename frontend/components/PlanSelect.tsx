import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TipoPlan } from "@/models/stats/plan";

interface PlanSelectProps {
    tipoPlan: TipoPlan;
    setTipoPlan: React.Dispatch<React.SetStateAction<TipoPlan>>;
}

export const PlanSelect = ({ tipoPlan, setTipoPlan }: PlanSelectProps) => {
    return (
        <Select
            value={tipoPlan}
            onValueChange={(value) => setTipoPlan(value as TipoPlan)}
        >
            <SelectTrigger className="rounded-xl border-input font-medium focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10">
                <SelectValue placeholder="Tipo de plan" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/60 shadow-floating">
                <SelectItem value="TODOS" className="rounded-lg font-medium">Todos</SelectItem>
                <SelectItem value="GIMNASIO" className="rounded-lg font-medium">Gimnasio</SelectItem>
                <SelectItem value="CLASE" className="rounded-lg font-medium">Clases</SelectItem>
            </SelectContent>
        </Select>
    );
};