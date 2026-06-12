import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import React, { useState } from "react"

interface PuntosModalProps {
    dni: string
    nombre: string
    open: boolean
    onClose: () => void
}

export function PuntosModal({ dni, nombre, open, onClose }: PuntosModalProps) {
    const [historial, setHistorial] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const fetchHistorial = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/puntos/${dni}`)
            const data = await res.json()
            setHistorial(data.historial || [])
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => {
        if (open) fetchHistorial()
    }, [open])

    const totalPuntos = historial.reduce(
        (acc, h) => acc + Number(h.Puntos ?? 0),
        0
    )

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl rounded-2xl shadow-floating">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold">
                        Historial de GymCoins —{" "}
                        <span className="text-brand-600">{nombre}</span>
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-6">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500/20 border-t-brand-500" />
                    </div>
                ) : historial.length === 0 ? (
                    <p className="text-center py-6 text-muted-foreground">
                        No hay registros de puntos.
                    </p>
                ) : (
                    <>
                        <div className="overflow-auto max-h-[400px] rounded-2xl border border-border/60">
                            <Table>
                                <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm">
                                    <TableRow className="border-b">
                                        <TableHead className="text-center text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Fecha</TableHead>
                                        <TableHead className="text-center text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Motivo</TableHead>
                                        <TableHead className="text-center text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Puntos</TableHead>
                                        <TableHead className="text-center text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Hora</TableHead>
                                        <TableHead className="text-center text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Responsable</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-border/60">
                                    {historial.map((h) => (
                                        <TableRow key={h.ID} className="hover:bg-muted/40 transition-colors">
                                            <TableCell className="text-center font-medium">
                                                {h.Fecha}
                                            </TableCell>
                                            <TableCell className="text-center font-medium">{h.Motivo}</TableCell>
                                            <TableCell className="text-center">
                                                <span
                                                    className={
                                                        Number(h.Puntos) >= 0
                                                            ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900"
                                                            : "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900"
                                                    }
                                                >
                                                    <span className={Number(h.Puntos) >= 0 ? "w-1.5 h-1.5 rounded-full bg-emerald-500" : "w-1.5 h-1.5 rounded-full bg-rose-500"} />
                                                    {h.Puntos}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center text-sm text-muted-foreground">
                                                {h.Hora}
                                            </TableCell>
                                            <TableCell className="text-center text-sm text-muted-foreground">
                                                {h.Responsable}
                                            </TableCell>

                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <DialogFooter className="flex flex-col md:flex-row justify-between items-center gap-3 pt-4">
                            <div className="text-xs text-muted-foreground font-medium text-center md:text-left flex-1">
                                Los registros de puntos suman los puntos del plan + los agregados como: pago antes del vencimiento, antigüedad, etc.
                            </div>

                            <div className="text-sm font-medium text-center md:text-right">
                                <p className="font-bold text-brand-600">
                                    Total: {totalPuntos}
                                </p>
                            </div>

                            <Button variant="orange" onClick={onClose} className="w-full md:w-auto bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-brand-btn btn-press">
                                Cerrar
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
