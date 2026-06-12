import React from 'react'
import { TooltipProps } from 'recharts/types/component/Tooltip';
import { Cake, Users } from "lucide-react";

export const CustomTooltipEdades: React.FC<TooltipProps<number, string>> = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;

        return (
            <div className="bg-card text-foreground rounded-xl border border-border/60 shadow-floating px-3 py-2 text-sm font-medium">
                <p className="font-bold flex items-center gap-1.5"><Cake className="w-3.5 h-3.5 text-pink-500" /> Edad: {data.edad}</p>
                <p className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-violet-500" /> Alumnos: {data.cantidad}</p>
            </div>
        );
    }
    return null;
};
