import { TooltipProps } from "recharts"

interface Props extends TooltipProps<number, string> {
    tipoPlan: "gimnasio" | "clase"
}

export const CustomTooltipAltasBajas = ({ active, payload, tipoPlan }: Props) => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0]
    const name = data.name
    const value = data.value ?? 0
    const color = data.color

    return (
        <div className="rounded-md border bg-background px-3 py-2 flex flex-col justify-center shadow-md text-sm">
            <div className="flex items-center gap-2 mb-1">
                <span
                    className=""
                    style={{ backgroundColor: color }}
                />
                <span className="font-semibold">{name}</span>
            </div>

            <div className={`text-md text-foreground font-bold `}>
                {tipoPlan === "gimnasio" ? "Gimnasio" : "Clases"}
            </div>

            <div className="mt-1 text-md font-medium">
                Total: {value}
            </div>
        </div>
    )
}
