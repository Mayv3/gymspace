'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, MessageCircle } from 'lucide-react'
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
    { label: 'Precio actual', value: '{{Precio}}' },
    { label: 'Fecha de vencimiento', value: '{{Fecha_vencimiento}}' },
]

const MENSAJE_ACTUALIZACION_CUOTA =
    'Hola {{Nombre}}! 👋 Te escribimos desde Gymspace para avisarte que actualizamos el valor de la cuota de tu plan {{Plan}}. ' +
    'El nuevo valor es {{Precio}}. ¡Gracias por entrenar con nosotros! 💪'

type Resultado = {
    total: number
    ejemplo: string | null
    lista: { nombre: string; plan: string }[]
}

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL

export default function WhatsappBroadcast() {
    const [planesDisponibles, setPlanesDisponibles] = useState<string[]>([])
    const [planes, setPlanes] = useState<string[]>([])
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [resultado, setResultado] = useState<Resultado | null>(null)
    const [openPreview, setOpenPreview] = useState(false)
    const [openConfirm, setOpenConfirm] = useState(false)

    useEffect(() => {
        fetch(`${BACKEND}/api/planes`)
            .then(r => r.json())
            .then((data: any[]) => {
                const vistos = new Map<string, string>()
                for (const p of data) {
                    // La hoja mezcla planes con productos, servicios y deudas: solo los planes los tienen alumnos
                    if (p.Tipo !== 'GIMNASIO' && p.Tipo !== 'CLASE') continue
                    const nombre = String(p['Plan o Producto'] || '').trim()
                    if (nombre && !vistos.has(nombre.toLowerCase())) vistos.set(nombre.toLowerCase(), nombre)
                }
                setPlanesDisponibles([...vistos.values()].sort((a, b) => a.localeCompare(b)))
            })
            .catch(() => notify.error('No se pudieron cargar los planes'))
    }, [])

    const isFormValid = planes.length > 0 && message.trim().length > 0

    const togglePlan = (plan: string) =>
        setPlanes(prev => (prev.includes(plan) ? prev.filter(p => p !== plan) : [...prev, plan]))

    // dryRun: simula y muestra la vista previa; con confirmar=true salta directo a la confirmación de envío
    const enviar = async (dryRun: boolean, confirmar = false) => {
        setLoading(true)
        try {
            const res = await fetch(`${BACKEND}/api/whatsapp/difusion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planes, mensaje: message, dryRun })
            })
            const data = await res.json()

            if (!res.ok) {
                notify.error(data.error || 'Error en la difusión')
                return
            }

            if (dryRun) {
                setResultado(data)
                if (!confirmar) setOpenPreview(true)
                else if (data.total > 0) setOpenConfirm(true)
                else notify.error('No hay alumnos activos en esos planes')
            } else {
                setOpenConfirm(false)
                notify.success(`Enviando a ${data.total} alumnos. Tarda unos minutos.`)
                setPlanes([])
                setMessage('')
            }
        } catch (err) {
            console.error(err)
            notify.error('Error en la difusión')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Card className="bg-card shadow-soft border border-border/60 rounded-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                        <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center dark:bg-brand-900/30">
                            <MessageCircle className="h-5 w-5" />
                        </span>
                        Difusión por WhatsApp
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-sm font-bold">
                                Planes ({planes.length} seleccionados) — solo alumnos activos
                            </label>
                            <div className="max-h-72 overflow-y-auto rounded-xl border border-border/60 p-3 space-y-2">
                                {planesDisponibles.map(plan => (
                                    <label key={plan} className="flex items-center gap-2 text-sm cursor-pointer">
                                        <Checkbox
                                            checked={planes.includes(plan)}
                                            onCheckedChange={() => togglePlan(plan)}
                                        />
                                        {plan}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col space-y-4">
                            <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                    <label className="text-sm font-bold">Mensaje</label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="rounded-xl font-bold"
                                        onClick={() => setMessage(MENSAJE_ACTUALIZACION_CUOTA)}
                                    >
                                        Usar mensaje de actualización de cuota
                                    </Button>
                                </div>
                                <Textarea
                                    rows={8}
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    placeholder="Escribí el mensaje..."
                                    className="resize-none rounded-xl border-input focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                                />
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {placeholders.map(p => (
                                        <Button
                                            key={p.value}
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => setMessage(prev => prev + ' ' + p.value)}
                                        >
                                            {p.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    disabled={loading || !isFormValid}
                                    onClick={() => enviar(true)}
                                    variant="outline"
                                    className="flex-1 bg-card border border-border rounded-xl font-bold hover:bg-muted"
                                >
                                    {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                                    Vista previa
                                </Button>

                                <Button
                                    disabled={loading || !isFormValid}
                                    onClick={() => enviar(true, true)}
                                    className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-brand-btn btn-press"
                                >
                                    {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                                    Enviar
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={openPreview} onOpenChange={setOpenPreview}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Vista previa de la difusión</DialogTitle>
                        <DialogDescription>
                            {resultado?.total
                                ? `Se enviará a ${resultado.total} alumnos activos.`
                                : 'No hay alumnos activos en esos planes.'}
                        </DialogDescription>
                    </DialogHeader>
                    {resultado && resultado.total > 0 && (
                        <div className="space-y-3">
                            <div className="p-3 border border-border/60 rounded-xl bg-muted/50 whitespace-pre-line">
                                {resultado.ejemplo}
                            </div>
                            <div className="max-h-40 overflow-y-auto text-sm text-muted-foreground space-y-1">
                                {resultado.lista.map((a, i) => (
                                    <div key={i}>{a.nombre} — {a.plan}</div>
                                ))}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setOpenPreview(false)}>
                            Cancelar
                        </Button>
                        {resultado && resultado.total > 0 && (
                            <Button
                                className="bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl"
                                onClick={() => { setOpenPreview(false); setOpenConfirm(true) }}
                            >
                                Continuar
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={openConfirm} onOpenChange={setOpenConfirm}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>¿Enviar la difusión?</DialogTitle>
                        <DialogDescription>
                            Se enviará por WhatsApp a {resultado?.total} alumnos. No se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setOpenConfirm(false)}>
                            Cancelar
                        </Button>
                        <Button
                            disabled={loading}
                            className="bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl"
                            onClick={() => enviar(false)}
                        >
                            {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                            Enviar ahora
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
