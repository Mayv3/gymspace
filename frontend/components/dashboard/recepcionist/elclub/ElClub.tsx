"use client"
import axios from 'axios'
import React, { useEffect, useRef, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Users, PlusCircle, Edit, Trash, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { notify } from '@/lib/toast'

interface Clase {
    ID: string
    'Nombre de clase': string
    Dia: string
    Hora: string
    'Cupo maximo': string
    Inscriptos: string
    InscriptosNombres: string
    ProximaFecha?: string
}

const DIAS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"]
const emptyForm = { nombre_clase: '', dia: '', hora: '', cupo_maximo: '' }

function ClaseCard({
    clase,
    onVerInscriptos,
    onEdit,
    onDelete,
}: {
    clase: Clase
    onVerInscriptos: (c: Clase) => void
    onEdit: (c: Clase) => void
    onDelete: (c: Clase) => void
}) {
    const inscriptos = clase.Inscriptos?.split(",").map(d => d.trim()).filter(Boolean) || []
    const lleno = inscriptos.length >= Number(clase['Cupo maximo'])

    return (
        <div
            className="border border-orange-200 dark:border-zinc-700 rounded-lg px-3 py-4 bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-between gap-2 cursor-pointer hover:bg-orange-50 dark:hover:bg-zinc-800 transition-colors"
            onClick={() => onVerInscriptos(clase)}
        >
            <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm leading-tight truncate">{clase['Nombre de clase']}</span>
                <span className="text-xs text-muted-foreground">{clase.Hora} hs · {clase.ProximaFecha}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
                <Badge
                    variant="outline"
                    className={`text-xs font-semibold ${
                        lleno
                            ? 'border-red-400 text-red-600 bg-red-50 dark:bg-red-900/20'
                            : inscriptos.length > 0
                                ? 'border-green-400 text-green-700 bg-green-50 dark:bg-green-900/20'
                                : 'border-gray-300 text-muted-foreground bg-gray-50 dark:bg-zinc-800'
                    }`}
                >
                    {inscriptos.length}/{clase['Cupo maximo']}
                </Badge>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={e => { e.stopPropagation(); onEdit(clase) }}>
                    <Edit className="h-3.5 w-3.5 text-primary" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={e => { e.stopPropagation(); onDelete(clase) }}>
                    <Trash className="h-3.5 w-3.5 text-destructive" />
                </Button>
            </div>
        </div>
    )
}

export const ElClub = () => {
    const [clases, setClases] = useState<Clase[]>([])
    const [loading, setLoading] = useState(false)

    const [modalOpen, setModalOpen] = useState(false)
    const [dniList, setDniList] = useState<string[]>([])
    const [nombreClase, setNombreClase] = useState("")
    const [classDateTime, setClassDateTime] = useState('')

    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [createForm, setCreateForm] = useState(emptyForm)

    const [showEditDialog, setShowEditDialog] = useState(false)
    const [editingClase, setEditingClase] = useState<Clase | null>(null)
    const [editForm, setEditForm] = useState(emptyForm)

    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [claseToDelete, setClaseToDelete] = useState<Clase | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Mobile slider
    const sliderRef = useRef<HTMLDivElement>(null)
    const [currentSlide, setCurrentSlide] = useState(0)

    const scrollToSlide = (index: number) => {
        const el = sliderRef.current
        if (!el) return
        el.scrollTo({ left: el.clientWidth * index, behavior: 'smooth' })
        setCurrentSlide(index)
    }

    const fetchClases = async () => {
        try {
            setLoading(true)
            const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/clases-el-club`)
            setClases(res.data)
        } catch {
            console.error("Error al cargar clases")
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (clase: Clase) => {
        const lista = clase.InscriptosNombres?.split(',').map(d => d.trim()).filter(Boolean) || []
        setDniList(lista)
        setNombreClase(clase['Nombre de clase'])
        setClassDateTime(`${clase.ProximaFecha} — ${clase.Hora} hs`)
        setModalOpen(true)
    }

    const handleConfirmCreate = async () => {
        const { nombre_clase, dia, hora, cupo_maximo } = createForm
        if (!nombre_clase || !dia || !hora || !cupo_maximo) { notify.error("Completá todos los campos."); return }
        setIsSubmitting(true)
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/clases-el-club`, createForm)
            await fetchClases()
            setShowCreateDialog(false)
            setCreateForm(emptyForm)
            notify.success("Clase creada con éxito.")
        } catch { notify.error("Error al crear la clase.") }
        setIsSubmitting(false)
    }

    const handleOpenEdit = (clase: Clase) => {
        setEditingClase(clase)
        setEditForm({ nombre_clase: clase['Nombre de clase'], dia: clase.Dia, hora: clase.Hora, cupo_maximo: clase['Cupo maximo'] })
        setShowEditDialog(true)
    }

    const handleConfirmEdit = async () => {
        if (!editingClase) return
        const { nombre_clase, dia, hora, cupo_maximo } = editForm
        if (!nombre_clase || !dia || !hora || !cupo_maximo) { notify.error("Completá todos los campos."); return }
        setIsSubmitting(true)
        try {
            await axios.patch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/clases-el-club/${editingClase.ID}`, editForm)
            await fetchClases()
            setShowEditDialog(false)
            setEditingClase(null)
            notify.success("Clase actualizada con éxito.")
        } catch { notify.error("Error al actualizar la clase.") }
        setIsSubmitting(false)
    }

    const handleConfirmDelete = async () => {
        if (!claseToDelete) return
        setIsSubmitting(true)
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/clases-el-club/${claseToDelete.ID}`)
            await fetchClases()
            setShowDeleteDialog(false)
            setClaseToDelete(null)
            notify.info("Clase eliminada.")
        } catch { notify.error("Error al eliminar la clase.") }
        setIsSubmitting(false)
    }

    useEffect(() => { fetchClases() }, [])

    return (
        <>
            <Card className="shadow-md">
                <CardHeader className="bg-orange-50 dark:bg-zinc-900 rounded-t-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl">Clases</CardTitle>
                            <CardDescription className="text-sm">Gestioná el cronograma · Tocá una clase para ver sus inscriptos.</CardDescription>
                        </div>
                        <Button variant="orange" onClick={() => setShowCreateDialog(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Agregar clase
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Cargando clases...</p>
                    ) : (
                        <>
                            {/* DESKTOP: columnas por día */}
                            <div className="hidden md:flex gap-4 overflow-x-auto pb-2">
                                {DIAS.map(dia => {
                                    const clasesDelDia = clases
                                        .filter(c => c.Dia.toLowerCase() === dia.toLowerCase())
                                        .sort((a, b) => a.Hora.localeCompare(b.Hora))
                                    return (
                                        <div key={dia} className="min-w-[175px] flex-1">
                                            <h3 className="text-sm font-bold text-center text-primary mb-2 pb-1 border-b border-orange-200 dark:border-zinc-700">
                                                {dia}
                                            </h3>
                                            <div className="space-y-2">
                                                {clasesDelDia.length === 0 ? (
                                                    <p className="text-xs text-muted-foreground text-center py-6">Sin clases</p>
                                                ) : clasesDelDia.map(clase => (
                                                    <ClaseCard
                                                        key={clase.ID}
                                                        clase={clase}
                                                        onVerInscriptos={handleOpenModal}
                                                        onEdit={handleOpenEdit}
                                                        onDelete={c => { setClaseToDelete(c); setShowDeleteDialog(true) }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* MOBILE: slider de a 1 día */}
                            <div className="block md:hidden">
                                <div className="relative">
                                    <div
                                        ref={sliderRef}
                                        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                                        onScroll={e => {
                                            const el = e.currentTarget
                                            setCurrentSlide(Math.round(el.scrollLeft / el.clientWidth))
                                        }}
                                    >
                                        {DIAS.map(dia => {
                                            const clasesDelDia = clases
                                                .filter(c => c.Dia.toLowerCase() === dia.toLowerCase())
                                                .sort((a, b) => a.Hora.localeCompare(b.Hora))
                                            return (
                                                <div key={dia} className="snap-start shrink-0 w-full px-1">
                                                    <h3 className="text-sm font-bold text-center text-primary mb-3 pb-1 border-b border-orange-200 dark:border-zinc-700">
                                                        {dia}
                                                    </h3>
                                                    {clasesDelDia.length === 0 ? (
                                                        <p className="text-sm text-muted-foreground text-center py-8">Sin clases</p>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {clasesDelDia.map(clase => (
                                                                <ClaseCard
                                                                    key={clase.ID}
                                                                    clase={clase}
                                                                    onVerInscriptos={handleOpenModal}
                                                                    onEdit={handleOpenEdit}
                                                                    onDelete={c => { setClaseToDelete(c); setShowDeleteDialog(true) }}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Controles */}
                                    <div className="flex items-center justify-between mt-3 px-1">
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-8 w-8"
                                            disabled={currentSlide === 0}
                                            onClick={() => scrollToSlide(currentSlide - 1)}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>

                                        {/* Dots */}
                                        <div className="flex gap-1.5">
                                            {DIAS.map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => scrollToSlide(i)}
                                                    className={`h-2 rounded-full transition-all ${i === currentSlide ? 'w-4 bg-orange-500' : 'w-2 bg-gray-300 dark:bg-zinc-600'}`}
                                                />
                                            ))}
                                        </div>

                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-8 w-8"
                                            disabled={currentSlide === DIAS.length - 1}
                                            onClick={() => scrollToSlide(currentSlide + 1)}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Modal inscriptos */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="rounded-lg max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader className="border-b pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <DialogTitle className="text-2xl font-bold text-primary">{nombreClase}</DialogTitle>
                            <Badge variant="outline" className="text-sm px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 w-fit">
                                {classDateTime}
                            </Badge>
                        </div>
                    </DialogHeader>
                    <div className="flex items-center gap-2 mt-4 mb-2">
                        <Users className="h-5 w-5 text-orange-600" />
                        <h3 className="text-sm font-semibold text-muted-foreground">Inscriptos ({dniList.length})</h3>
                    </div>
                    <div className="overflow-y-auto flex-1 pr-2">
                        {dniList.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {dniList.map((nombre, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-800/50">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-200 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 font-semibold text-sm">
                                            {index + 1}
                                        </div>
                                        <span className="text-sm font-medium">{nombre}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Users className="h-12 w-12 text-muted-foreground/40 mb-3" />
                                <p className="text-muted-foreground text-sm">No hay inscriptos en esta clase.</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Crear clase */}
            <ConfirmDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                title="Agregar clase"
                description="Completá los datos de la nueva clase."
                confirmText="Crear"
                cancelText="Cancelar"
                loading={isSubmitting}
                onConfirm={handleConfirmCreate}
            >
                <div className="space-y-4 text-sm">
                    <div className="flex flex-col gap-1">
                        <Label>Nombre de clase</Label>
                        <Input value={createForm.nombre_clase} onChange={e => setCreateForm(p => ({ ...p, nombre_clase: e.target.value }))} placeholder="Ej: Yoga, Pilates..." />
                    </div>
                    <div className="flex flex-col gap-1">
                        <Label>Día</Label>
                        <Select value={createForm.dia} onValueChange={v => setCreateForm(p => ({ ...p, dia: v }))}>
                            <SelectTrigger><SelectValue placeholder="Seleccioná un día" /></SelectTrigger>
                            <SelectContent>{DIAS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <Label>Horario</Label>
                        <Input type="time" value={createForm.hora} onChange={e => setCreateForm(p => ({ ...p, hora: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <Label>Cupo máximo</Label>
                        <Input type="number" min={1} value={createForm.cupo_maximo} onChange={e => setCreateForm(p => ({ ...p, cupo_maximo: e.target.value }))} placeholder="Ej: 20" />
                    </div>
                </div>
            </ConfirmDialog>

            {/* Editar clase */}
            <ConfirmDialog
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                title="Editar clase"
                description="Modificá los datos de esta clase."
                confirmText="Guardar cambios"
                cancelText="Cancelar"
                loading={isSubmitting}
                onConfirm={handleConfirmEdit}
            >
                <div className="space-y-4 text-sm">
                    <div className="flex flex-col gap-1">
                        <Label>Nombre de clase</Label>
                        <Input value={editForm.nombre_clase} onChange={e => setEditForm(p => ({ ...p, nombre_clase: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <Label>Día</Label>
                        <Select value={editForm.dia} onValueChange={v => setEditForm(p => ({ ...p, dia: v }))}>
                            <SelectTrigger><SelectValue placeholder="Seleccioná un día" /></SelectTrigger>
                            <SelectContent>{DIAS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <Label>Horario</Label>
                        <Input type="time" value={editForm.hora} onChange={e => setEditForm(p => ({ ...p, hora: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <Label>Cupo máximo</Label>
                        <Input type="number" min={1} value={editForm.cupo_maximo} onChange={e => setEditForm(p => ({ ...p, cupo_maximo: e.target.value }))} />
                    </div>
                </div>
            </ConfirmDialog>

            {/* Eliminar clase */}
            <ConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="¿Eliminar clase?"
                description="Esta acción es permanente y no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                loading={isSubmitting}
                destructive
                onConfirm={handleConfirmDelete}
            >
                {claseToDelete && (
                    <div className="space-y-2 p-4 bg-muted/50 rounded-md text-sm">
                        <div className="flex justify-between font-medium"><span>Clase:</span><span>{claseToDelete['Nombre de clase']}</span></div>
                        <div className="flex justify-between font-medium"><span>Día:</span><span>{claseToDelete.Dia}</span></div>
                        <div className="flex justify-between font-medium"><span>Hora:</span><span>{claseToDelete.Hora}</span></div>
                        <div className="flex justify-between font-medium"><span>Cupo máximo:</span><span>{claseToDelete['Cupo maximo']}</span></div>
                    </div>
                )}
            </ConfirmDialog>
        </>
    )
}
