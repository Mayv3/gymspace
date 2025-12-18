"use client";

import dayjs from "dayjs";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { YearCalendar } from "./YearCalendar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CircularProgress } from "@mui/material";
type Turno = "all" | "manana" | "tarde" | "noche";
type TipoPlan = "gimnasio" | "clase";

interface DiaActividad {
    fecha: string;
    tipo_plan: string;
    turno: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    tipo: TipoPlan;
}

export const AnnualCalendarModal = ({ open, onClose, tipo }: Props) => {
    const [loading, setLoading] = useState(false);
    const [dias, setDias] = useState<DiaActividad[]>([]);
    const [turno, setTurno] = useState<Turno>("all");

    useEffect(() => {
        if (!open) return;

        const fetchDias = async () => {
            try {
                setLoading(true);
                const res = await axios.get(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dashboard/detalle-promedios`,
                    {
                        params: {
                            fecha: dayjs().format("YYYY-MM-DD"),
                        },
                    }
                );
                setDias(res.data.dias || []);
            } catch (e) {
                console.error("Error calendario anual:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchDias();
    }, [open]);

    const diasPorFecha = useMemo(() => {
        const map: Record<string, Set<string>> = {};
        dias.forEach((d) => {
            if (d.tipo_plan !== tipo.toUpperCase()) return;
            map[d.fecha] ??= new Set();
            map[d.fecha].add(d.turno);
        });
        return map;
    }, [dias, tipo]);

    const isActiveDay = (date: string) => {
        const set = diasPorFecha[date];
        if (!set) return false;
        if (turno === "all") return true;
        return set.has(turno);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Calendario anual de asistencias – {tipo}
                    </DialogTitle>
                </DialogHeader>
                <div className="mb-4 max-w-xs">
                    <Select value={turno} onValueChange={(v) => setTurno(v as Turno)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filtrar por turno" />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="all">Todos los turnos</SelectItem>
                            <SelectItem value="manana">Mañana</SelectItem>
                            <SelectItem value="tarde">Tarde</SelectItem>
                            <SelectItem value="noche">Noche</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {loading ? (
                    <CircularProgress sx={{ color: "#f97316" }} size={36} />
                ) : (
                    <YearCalendar isActiveDay={isActiveDay} />
                )}
            </DialogContent>
        </Dialog>
    );
};
