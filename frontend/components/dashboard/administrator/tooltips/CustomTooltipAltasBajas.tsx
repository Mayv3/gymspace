import { TooltipProps } from "recharts"

interface Props extends TooltipProps<number, string> {
    tipoPlan: "gimnasio" | "clase"
    porVencer?: number
}

export const CustomTooltipAltasBajas = ({ active, payload, tipoPlan, porVencer = 0 }: Props) => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0]
    const name = data.name
    const value = data.value ?? 0
    const color = data.color

    return (
        <div className="bg-card rounded-xl border border-border/60 shadow-floating px-3 py-2 flex flex-col justify-center text-sm font-medium">
            <div className="flex items-center gap-2 mb-1">
                <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                />
                <span className="font-bold">{name}</span>
            </div>

            <div className="text-md text-foreground font-bold">
                {tipoPlan === "gimnasio" ? "Gimnasio" : "Clases"}
            </div>

            <div className="mt-1 text-md font-medium">
                Total: {value}
            </div>

            {name === "Bajas" && porVencer > 0 && (
                <div className="mt-1 text-sm text-muted-foreground">
                    Faltan vencer: <span className="font-bold text-foreground">{porVencer}</span>
                </div>
            )}
        </div>
    )
}
