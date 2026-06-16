"use client"

import React, { useEffect, useState } from "react"
import axios from "axios"
import dayjs from "dayjs"
import "dayjs/locale/es"
import { Mail } from "lucide-react"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
dayjs.locale("es")

interface MailEnviado {
    id: string
    email: string
    subject: string
    date: string | null
}

export const EmailsSent = () => {
    const [data, setData] = useState<MailEnviado[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        axios
            .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dashboard/emails-enviados`, {
                params: { limit: 50 },
            })
            .then(res => setData(res.data?.emails ?? []))
            .catch(err => {
                console.error("Error emails-enviados:", err)
                setData([])
            })
            .finally(() => setLoading(false))
    }, [])

    return (
        <Card className="rounded-2xl border-border/60 shadow-soft hover:shadow-floating transition-shadow">
            <CardHeader className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/30 text-orange-500 flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                </div>
                <CardTitle className="font-bold">
                    Mails enviados hoy
                    {!loading && (
                        <span className="ml-2 text-orange-500">({data.length})</span>
                    )}
                </CardTitle>
            </CardHeader>

            <CardContent>
                {loading ? (
                    <div className="flex justify-center mt-8">
                        <div className="w-9 h-9 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
                    </div>
                ) : data.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center mt-8">
                        No se enviaron mails hoy.
                    </p>
                ) : (
                    <ul data-lenis-prevent className="divide-y max-h-[320px] overflow-y-auto">
                        {data.map(m => (
                            <li
                                key={m.id}
                                className="px-2 py-3 rounded-lg hover:bg-muted/40 transition"
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-sm truncate">
                                            {m.email}
                                        </span>
                                        <span className="text-xs text-muted-foreground truncate">
                                            {m.subject}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                                        {m.date ? dayjs(m.date).format("HH:mm") : ""}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    )
}
