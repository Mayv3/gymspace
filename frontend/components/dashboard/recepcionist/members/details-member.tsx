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
import { Badge } from "@/components/ui/badge"
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
            <DialogContent className="max-w-3xl rounded-2xl shadow-xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold">
                        Historial de GymCoins —{" "}
                        <span className="text-orange-600">{nombre}</span>
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <p className="text-center py-6 text-muted-foreground">Cargando...</p>
                ) : historial.length === 0 ? (
                    <p className="text-center py-6 text-muted-foreground">
                        No hay registros de puntos.
                    </p>
                ) : (
                    <>
                        <div className="overflow-auto max-h-[400px] rounded-md border">
                            <Table>
                                <TableHeader className="sticky top-0 bg-muted/60 backdrop-blur-sm">
                                    <TableRow>
                                        <TableHead className="text-center">Fecha</TableHead>
                                        <TableHead className="text-left">Motivo</TableHead>
                                        <TableHead className="text-center">Puntos</TableHead>
                                        <TableHead className="text-center">Responsable</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {historial.map((h) => (
                                        <TableRow key={h.ID}>
                                            <TableCell className="text-center font-medium">
                                                {h.Fecha}
                                            </TableCell>
                                            <TableCell className="text-left">{h.Motivo}</TableCell>
                                            <TableCell className="text-center font-semibold">
                                                <Badge
                                                    variant={
                                                        Number(h.Puntos) >= 0
                                                            ? "success"
                                                            : "destructive"
                                                    }
                                                    className="px-2 py-1 rounded-md"
                                                >
                                                    {h.Puntos}
                                                </Badge>
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
                            <div className="text-xs text-muted-foreground text-center md:text-left flex-1">
                                Si ves una diferencia de -100 puntos en este total es porque pagó antes de la fecha de vencimiento. 
                                Los agregados no se registran al pagar el plan.
                            </div>

                            <div className="text-sm font-medium text-center md:text-right">
                                <p className="font-bold text-orange-600">
                                    Total: {totalPuntos}
                                </p>
                            </div>

                            <Button variant="orange" onClick={onClose} className="w-full md:w-auto">
                                Cerrar
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
