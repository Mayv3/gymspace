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
    <Card className="shadow-lg hover:shadow-xl transition-all">
      <CardContent>
        <CardHeader className="flex flex-col items-center gap-2">
          <BarChart3Icon className="text-orange-500" />
          <CardTitle>Alumnos por Plan</CardTitle>
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
              <XAxis
                dataKey="plan"
                tick={!isMobile}
                hide={isMobile}
              />

              <YAxis
                hide={isMobile}
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
