"use client"

import React, { useEffect, useState } from "react"
import axios from "axios"
import dayjs from "dayjs"
import "dayjs/locale/es"
import { MessageCircle } from "lucide-react"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
dayjs.locale("es")

interface WhatsappMensaje {
    id: number
    nombre: string
    telefono: string
    plan: string
    vencimiento: string
    mensaje: string
    enviado_at: string
}

export const WhatsappMessages = () => {
    const [data, setData] = useState<WhatsappMensaje[]>([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState<WhatsappMensaje | null>(null)

    useEffect(() => {
        setLoading(true)
        axios
            .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dashboard/whatsapp-mensajes`, {
                params: { limit: 20 },
            })
            .then(res => setData(res.data ?? []))
            .catch(err => {
                console.error("Error whatsapp-mensajes:", err)
                setData([])
            })
            .finally(() => setLoading(false))
    }, [])

    return (
        <>
            <Card className="rounded-2xl border-border/60 shadow-soft hover:shadow-floating transition-shadow">
                <CardHeader className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5" />
                    </div>
                    <CardTitle className="font-bold">Últimos mensajes de WhatsApp</CardTitle>
                </CardHeader>

                <CardContent>
                    {loading ? (
                        <div className="flex justify-center mt-8">
                            <div className="w-9 h-9 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                        </div>
                    ) : data.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center mt-8">
                            No hay mensajes enviados.
                        </p>
                    ) : (
                        <ul data-lenis-prevent className="divide-y max-h-[320px] overflow-y-auto">
                            {data.map(m => (
                                <li
                                    key={m.id}
                                    onClick={() => setSelected(m)}
                                    className="px-2 py-3 rounded-lg hover:bg-muted/40 transition cursor-pointer"
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-bold text-sm truncate">
                                                {m.nombre || m.telefono}
                                            </span>
                                            <span className="text-xs text-muted-foreground truncate">
                                                {m.plan}
                                                {m.vencimiento && ` · Vence: ${m.vencimiento}`}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                                            {dayjs(m.enviado_at).format("DD/MM/YY HH:mm")}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {m.mensaje}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
                <DialogContent data-lenis-prevent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 font-bold">
                            <MessageCircle className="text-emerald-500" size={18} />
                            {selected?.nombre || selected?.telefono}
                        </DialogTitle>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-2 text-sm">
                            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                <span>Teléfono: {selected.telefono}</span>
                                <span>Plan: {selected.plan}</span>
                                {selected.vencimiento && <span>Vencimiento: {selected.vencimiento}</span>}
                                <span>Enviado: {dayjs(selected.enviado_at).format("DD/MM/YYYY HH:mm")}</span>
                            </div>
                            <div data-lenis-prevent className="border border-border/60 rounded-xl p-3 bg-muted/30 whitespace-pre-wrap text-sm font-medium max-h-[50vh] overflow-y-auto">
                                {selected.mensaje}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
