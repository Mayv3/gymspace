"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "@/components/ui/chart"

const data = [
  {
    name: "Ene",
    total: 2400,
  },
  {
    name: "Feb",
    total: 1398,
  },
  {
    name: "Mar",
    total: 3800,
  },
  {
    name: "Abr",
    total: 3908,
  },
  {
    name: "May",
    total: 4800,
  },
  {
    name: "Jun",
    total: 3800,
  },
  {
    name: "Jul",
    total: 4300,
  },
  {
    name: "Ago",
    total: 5300,
  },
  {
    name: "Sep",
    total: 4900,
  },
  {
    name: "Oct",
    total: 3800,
  },
  {
    name: "Nov",
    total: 4800,
  },
  {
    name: "Dic",
    total: 5200,
  },
]

export function IncomeChart() {
  return (
    <ResponsiveContainer width="100%" height={300} minWidth={300}>
      <LineChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-card rounded-xl border border-border/60 shadow-floating px-3 py-2 text-sm font-medium max-w-[200px]">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-[0.70rem] font-bold uppercase tracking-widest text-muted-foreground">Mes:</span>
                      <span className="font-bold text-muted-foreground">{payload[0].payload.name}</span>
                    </div>
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-[0.70rem] font-bold uppercase tracking-widest text-muted-foreground">Ingresos:</span>
                      <span className="font-bold text-brand-500">${payload[0].value}</span>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#ff6a00"
          strokeWidth={2}
          activeDot={{
            r: 6,
            style: { fill: "#ff6a00", opacity: 0.8 },
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

