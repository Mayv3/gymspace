import React from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { COLORS } from "./colors";
import { TipoPlan, Plan } from '@/models/stats/plan';
import { BarChart3Icon } from 'lucide-react';
import { PlanSelect } from '@/components/PlanSelect';
import { CustomTooltipPlanes } from '../tooltips/CustomTooltipPlanes';
import { useIsMobile } from "@/hooks/use-mobile"

interface MembersPlanProps {
  tipoPlan: TipoPlan;
  planesFiltrados: Plan[];
  setTipoPlan: React.Dispatch<React.SetStateAction<TipoPlan>>;
}

export const MembersPlan = ({
  tipoPlan,
  planesFiltrados = [],
  setTipoPlan,
}: MembersPlanProps) => {
  const isMobile = useIsMobile()

  return (
    <Card className="rounded-2xl border-border/60 shadow-soft hover:shadow-floating transition-shadow">
      <CardContent>
        <CardHeader className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-500 flex items-center justify-center">
            <BarChart3Icon className="w-5 h-5" />
          </div>
          <CardTitle className="font-bold">Alumnos por Plan</CardTitle>
        </CardHeader>

        <div className="flex justify-end mb-2">
          <div className="w-[140px]">
            <PlanSelect tipoPlan={tipoPlan} setTipoPlan={setTipoPlan} />
          </div>
        </div>

        {planesFiltrados.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center mt-8">
            No hay datos disponibles.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={315}>
            <BarChart data={planesFiltrados}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
              <XAxis
                dataKey="plan"
                tick={!isMobile && { fontSize: 12 }}
                hide={isMobile}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                hide={isMobile}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
              />

              <Tooltip content={<CustomTooltipPlanes />} />
              <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                {planesFiltrados.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
