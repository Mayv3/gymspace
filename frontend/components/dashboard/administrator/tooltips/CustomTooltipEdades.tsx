import React from 'react'
import { TooltipProps } from 'recharts/types/component/Tooltip';

export const CustomTooltipEdades: React.FC<TooltipProps<number, string>> = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;

        return (
            <div className="p-2 rounded-md shadow text-sm border bg-white dark:bg-gray-800 dark:text-white">
                <p className="font-semibold">🎂 Edad: {data.edad}</p>
                <p>👥 Alumnos: {data.cantidad}</p>
            </div>
        );
    }
    return null;
};