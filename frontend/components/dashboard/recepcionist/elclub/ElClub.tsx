import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import {
    Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from "@/components/ui/table"
import { Button } from '@/components/ui/button'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('es')

interface Clase {
    ID: string
    'Nombre de clase': string
    Dia: string
    Hora: string
    'Cupo maximo': string
    Inscriptos: string
    ProximaFecha?: string
}

export const ElClub = () => {
    const [clases, setClases] = useState<Clase[]>([])
    const [loading, setLoading] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [dniList, setDniList] = useState<string[]>([])
    const [nombreClase, setNombreClase] = useState("")

    const ARG_TZ = "America/Argentina/Buenos_Aires";
    const now = dayjs().tz(ARG_TZ);

    const clasesFiltradas = clases.filter((clase) => {
        const fechaRaw = clase.ProximaFecha?.trim() || ""
        if (!fechaRaw || !clase.Hora) return false

        const fechaHora = `${fechaRaw} ${clase.Hora}`
        const formatos = ["D/M/YYYY H:mm", "D/M/YYYY HH:mm", "DD/MM/YYYY H:mm", "DD/MM/YYYY HH:mm"]
        const claseDate = dayjs.tz(fechaHora, formatos, ARG_TZ)

        return claseDate.isValid() && claseDate.isAfter(now)
    })



    const fetchClases = async () => {
        try {
            setLoading(true)
            const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/clases-el-club`)
            setClases(res.data)
        } catch (err) {
            console.error("Error al cargar clases:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (clase: Clase) => {
        const lista = clase.Inscriptos?.split(",").map(d => d.trim()).filter(d => d) || []
        setDniList(lista)
        setNombreClase(clase["Nombre de clase"])
        setModalOpen(true)
    }

    useEffect(() => {
        fetchClases()
    }, [])

    return (
        <>
            <Card className="shadow-md border border-orange-300">
                <CardHeader className="bg-orange-50 rounded-t-lg">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-orange-600" />
                        <div>
                            <CardTitle className="text-orange-700 text-lg sm:text-xl">Listado de Clases</CardTitle>
                            <CardDescription className="text-muted-foreground text-sm">
                                Visualizá todas las clases y consultá los inscriptos.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4">

                    {loading ? (
                        <p className="text-sm text-muted-foreground">Cargando clases...</p>
                    ) : (
                        <>
                            <div className="hidden md:block overflow-x-auto">
                                <Table className="min-w-[700px] table-fixed w-full">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-1/6 text-center">Clase</TableHead>
                                            <TableHead className="w-1/6 text-center">Día</TableHead>
                                            <TableHead className="w-1/6 text-center">Hora</TableHead>
                                            <TableHead className="w-1/6 text-center">Fecha</TableHead>
                                            <TableHead className="text-center w-1/6">Inscriptos</TableHead>
                                            <TableHead className="text-center w-1/6">Acción</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {clasesFiltradas.map((clase) => {
                                            const inscriptos = clase.Inscriptos?.split(',').map(d => d.trim()).filter(d => d) || []
                                            return (
                                                <TableRow key={clase.ID}>
                                                    <TableCell className='text-center w-1/6'>{clase["Nombre de clase"]}</TableCell>
                                                    <TableCell className='text-center w-1/6'>{clase.Dia}</TableCell>
                                                    <TableCell className='text-center w-1/6'>{clase.Hora}</TableCell>
                                                    <TableCell className='text-center w-1/6'>{clase.ProximaFecha}</TableCell>
                                                    <TableCell className="text-center w-1/6">
                                                        <span className="font-medium">{inscriptos.length}</span> / {clase["Cupo maximo"]}
                                                    </TableCell>
                                                    <TableCell className="text-center w-1/6">
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => handleOpenModal(clase)}
                                                            disabled={inscriptos.length === 0}
                                                        >
                                                            Ver inscriptos
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="block md:hidden space-y-4">
                                {clasesFiltradas.map((clase) => {
                                    const inscriptos = clase.Inscriptos?.split(',').map(d => d.trim()).filter(d => d) || []
                                    return (
                                        <div key={clase.ID} className="h-[200px] border border-orange-200 rounded-lg p-4 shadow-sm flex flex-col justify-between">

                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="text-lg font-semibold">{clase["Nombre de clase"]}</h3>
                                                <span className="text-sm font-semibold">{clase.Dia} - {clase.Hora} <br /> <strong>{clase.ProximaFecha}</strong></span>

                                            </div>


                                            <p className="text-lg text-center mb-3">
                                                <strong>Inscriptos:</strong> {inscriptos.length} / {clase["Cupo maximo"]}
                                            </p>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => handleOpenModal(clase)}
                                                disabled={inscriptos.length === 0}
                                            >
                                                Ver inscriptos
                                            </Button>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-md sm:max-w-lg rounded-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl sm:text-2xl">
                            Inscriptos en "{nombreClase}"
                        </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {dniList.length > 0 ? (
                            dniList.map((dni, index) => (
                                <Badge key={index} variant="outline" className="text-sm px-2 py-1">
                                    {dni}
                                </Badge>
                            ))
                        ) : (
                            <p className="text-muted-foreground text-sm">No hay inscriptos.</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
