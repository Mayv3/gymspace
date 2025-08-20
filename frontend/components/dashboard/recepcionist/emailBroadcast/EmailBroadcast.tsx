'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail } from 'lucide-react'
import Picker from "@emoji-mart/react"
import data from "@emoji-mart/data"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog'

import { notify } from '@/lib/toast'

const placeholders = [
    { label: 'Nombre', value: '{{Nombre}}' },
    { label: 'Plan', value: '{{Plan}}' },
    { label: 'Fecha de vencimiento', value: '{{Fecha_vencimiento}}' },
    { label: 'Profesor asignado', value: '{{Profesor_asignado}}' },
    { label: 'GymCoins', value: '{{GymCoins}}' }
]

export default function EmailBroadcast() {
    const [tipo, setTipo] = useState<'GIMNASIO' | 'CLASE' | 'PARTICULAR' | ''>('')
    const [emailParticular, setEmailParticular] = useState('')
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [preview, setPreview] = useState<any | null>(null)
    const [openPreview, setOpenPreview] = useState(false)
    const [cooldown, setCooldown] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined") return

        const saved = localStorage.getItem("emailBroadcastForm")
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                if (parsed.tipo) setTipo(parsed.tipo)
                if (parsed.emailParticular) setEmailParticular(parsed.emailParticular)
                if (parsed.subject) setSubject(parsed.subject)
                if (parsed.message) setMessage(parsed.message)
            } catch (err) {
                console.error("Error parseando localStorage:", err)
            }
        }
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return

        const payload = {
            tipo,
            emailParticular,
            subject,
            message,
        }
        localStorage.setItem("emailBroadcastForm", JSON.stringify(payload))
    }, [tipo, emailParticular, subject, message])

    const isFormValid = () => {
        if (!tipo) return false
        if (!subject.trim()) return false
        if (!message.trim()) return false
        if (tipo === 'PARTICULAR' && !emailParticular.trim()) return false
        return true
    }

    const insertPlaceholder = (value: string) => {
        setMessage(prev => prev + ' ' + value)
    }

    const handleSend = async (dryRun = false) => {
        if (!isFormValid()) {
            notify.error("Por favor completa todos los campos antes de enviar.")
            return
        }

        setLoading(true)
        setPreview(null)
        setCooldown(true)

        try {
            const body: any = { subject, text: message, dryRun }
            if (tipo === 'GIMNASIO' || tipo === 'CLASE') body.filters = { tipo }
            if (tipo === 'PARTICULAR') body.onlyEmails = [emailParticular]

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/emails/broadcast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })
            const data = await res.json()

            if (!res.ok || data.ok === false) {
                notify.error(data.error || 'Error enviando mail')
                return
            }

            if (dryRun) {
                if (data.preview?.length > 0) {
                    setPreview(data.preview[0])
                    setOpenPreview(true)
                    notify.success("Vista previa generada")
                } else {
                    notify.error("No hay datos para previsualizar")
                }
            } else {
                notify.success(`Se están mandando los mails en los próximos minutos`)

                setTipo('')
                setEmailParticular('')
                setSubject('')
                setMessage('')
                localStorage.removeItem("emailBroadcastForm")
            }
        } catch (err) {
            console.error(err)
            notify.error("Error enviando mail")
        } finally {
            setLoading(false)
            setTimeout(() => setCooldown(false), 3000)
        }
    }

    return (
        <>
            <Card className="shadow-lg border rounded-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Mail className="h-5 w-5" /> Difusión de Emails
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Columna izquierda */}
                        <div className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Tipo de difusión</label>
                                <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccioná tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GIMNASIO">Gimnasio</SelectItem>
                                        <SelectItem value="CLASE">Clase</SelectItem>
                                        <SelectItem value="PARTICULAR">Particular</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {tipo === 'PARTICULAR' && (
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Email destinatario</label>
                                    <Input
                                        value={emailParticular}
                                        onChange={e => setEmailParticular(e.target.value)}
                                        placeholder="ej: usuario@mail.com"
                                    />
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-sm font-medium">Asunto</label>
                                <Input
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    placeholder="Ej: Aviso de vencimiento"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Insertar campos</label>
                                <div className="flex flex-wrap gap-2">
                                    {placeholders.map(p => (
                                        <Button
                                            key={p.value}
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => insertPlaceholder(p.value)}
                                        >
                                            {p.label}
                                        </Button>
                                    ))}

                                    {/* Botón con popover para emojis */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                className="border border-orange-400 text-orange-500 hover:bg-orange-50 rounded-full px-3"
                                            >
                                                Insertar emoji 😀
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="p-0 w-auto">
                                            <Picker
                                                data={data}
                                                onEmojiSelect={(emoji: any) => setMessage(prev => prev + emoji.native)}
                                                locale="es"
                                                previewPosition="none"
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>

                        {/* Columna derecha */}

                        <div className="flex flex-col space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Mensaje</label>
                                <Textarea
                                    rows={10}
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    placeholder="Escribí el mensaje..."
                                    className="resize-none"
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    disabled={loading || cooldown || !isFormValid()}
                                    onClick={() => handleSend(true)}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                                    Vista previa
                                </Button>

                                <Button
                                    disabled={loading || cooldown || !isFormValid()}
                                    onClick={() => handleSend(false)}
                                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                                >
                                    {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                                    Enviar
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Modal Vista Previa */}

            <Dialog open={openPreview} onOpenChange={setOpenPreview}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Vista previa del correo</DialogTitle>
                        <DialogDescription>
                            Así se verá el correo que recibirá un alumno.
                        </DialogDescription>
                    </DialogHeader>
                    {preview && (
                        <div className="space-y-3 p-3 border rounded bg-gray-50">
                            <div>
                                <b>{preview.Nombre}</b> <span className="text-gray-500">({preview.Email})</span>
                            </div>
                            <div className="text-sm text-gray-600">Plan: {preview.Plan} — {preview.PlanTipo}</div>
                            <div className="border-t pt-2 whitespace-pre-line">{preview.Texto}</div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setOpenPreview(false)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
