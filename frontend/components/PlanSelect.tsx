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
            <SelectTrigger>
                <SelectValue placeholder="Tipo de plan" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="GIMNASIO">Gimnasio</SelectItem>
                <SelectItem value="CLASE">Clases</SelectItem>
            </SelectContent>
        </Select>
    );
};