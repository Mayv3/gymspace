import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash, PlusCircle } from "lucide-react"

import { AddMemberDialog } from "@/components/dashboard/recepcionist/members/add-member-dialog"
import { EditMemberDialog } from "@/components/dashboard/recepcionist/members/edit-member-dialog"
import { DeleteMemberDialog } from "@/components/dashboard/recepcionist/members/delete-member-dialog"
import { useAppData } from "@/context/AppDataContext"
import { Member } from "@/models/dashboard"
import { RankingDialog } from "../recepcionist/members/Ranking-dialog"

interface Alumno {
  ID: string
  DNI: string
  Nombre: string
  Email: string
  Telefono: string
  Sexo: string
  Fecha_nacimiento: string
  Plan: string
  Clases_pagadas: string
  Clases_realizadas: string
  Fecha_inicio: string
  Fecha_vencimiento: string
  Profesor_asignado: string
}

interface MembersStatsTabProps {
  members: Member[];
  onMemberAdded: (newMember: Member) => void;
  topAlumnos: {
    top10Clases: any[];
    top10Gimnasio: any[];
  };
}

export function MembersStatsTab({ onMemberAdded, topAlumnos }: MembersStatsTabProps) {
  const { alumnos, setAlumnos } = useAppData()
  const total = alumnos.length;

  const [sexo, setSexo] = useState("")
  const [edadMin, setEdadMin] = useState("")
  const [edadMax, setEdadMax] = useState("")
  const [profe, setProfe] = useState("")
  const [plan, setPlan] = useState("")
  const [nombre, setNombre] = useState("")

  const [selectedAlumno, setSelectedAlumno] = useState<Alumno | null>(null)
  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [openRanking, setOpenRanking] = useState(false)

  const { planes } = useAppData();

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredAlumnos = useMemo(() => {
    return alumnos.filter((a) => {
      const cumpleSexo = !sexo || a.Sexo === sexo
      const cumpleEdadMin = !edadMin || calcularEdad(a.Fecha_nacimiento) >= parseInt(edadMin)
      const cumpleEdadMax = !edadMax || calcularEdad(a.Fecha_nacimiento) <= parseInt(edadMax)
      const cumpleProfe = !profe || a.Profesor_asignado?.toLowerCase().includes(profe.toLowerCase())
      const cumplePlan = !plan || plan === "todos" || a.Plan?.toLowerCase() === plan.toLowerCase()
      const cumpleNombre = !nombre || a.Nombre?.toLowerCase().includes(nombre.toLowerCase())

      return (
        cumpleSexo &&
        cumpleEdadMin &&
        cumpleEdadMax &&
        cumpleProfe &&
        cumplePlan &&
        cumpleNombre
      )
    })
  }, [alumnos, sexo, edadMin, edadMax, profe, plan, nombre])

  const totalPages = Math.ceil(filteredAlumnos.length / itemsPerPage)

  function calcularEdad(fecha: string): number {
    const [dia, mes, año] = fecha.split("/")
    const fechaNacimiento = new Date(`${año}-${mes}-${dia}`)
    const hoy = new Date()
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear()
    const mesActual = hoy.getMonth()
    const mesNacimiento = fechaNacimiento.getMonth()
    const diaNacimiento = fechaNacimiento.getDate()

    if (
      mesActual < mesNacimiento ||
      (mesActual === mesNacimiento && hoy.getDate() < diaNacimiento)
    ) {
      edad--
    }

    return edad
  }

  const paginatedAlumnos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredAlumnos.slice(start, start + itemsPerPage)
  }, [filteredAlumnos, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [sexo, edadMin, edadMax, profe, plan, nombre])

  return (
    <Card>
      <CardHeader className="bg-orange-50 dark:bg-zinc-900 rounded-t-lg mb-4">
        <CardTitle className="pb-3">Estadísticas de Alumnos</CardTitle>
        <div className="flex flex-wrap justify-between gap-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:flex gap-2">
            <Input
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full md:w-[150px]"
            />
            <Input
              placeholder="Profesor"
              value={profe}
              onChange={(e) => setProfe(e.target.value)}
              className="w-full md:w-[150px]"
            />

            <Select onValueChange={setSexo}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Sexo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Femenino</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={setPlan} value={plan}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Seleccionar plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {planes.map((plan, index) => (
                  <SelectItem key={index} value={plan["Plan o Producto"]}>
                    {plan["Plan o Producto"]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-col items-start mt-3 md:mt-0">
              <label className="text-sm">Edad mínima: {edadMin || 0}</label>
              <input
                type="range"
                min={0}
                max={100}
                value={edadMin}
                onChange={(e) => setEdadMin(e.target.value)}
                className="w-full md:w-[150px] accent-orange-500"
              />
            </div>

            <div className="flex flex-col items-start mt-3 md:mt-0">
              <label className="text-sm">Edad máxima: {edadMax || 100}</label>
              <input
                type="range"
                min={0}
                max={100}
                value={edadMax}
                onChange={(e) => setEdadMax(e.target.value)}
                className="w-full md:w-[150px] accent-orange-500"
              />
            </div>
          </div>
          <div className="flex w-full md:w-[320px] md:mx-3 gap-2">
            <Button onClick={() => setOpenRanking(true)} variant="orange" className="w-[50%] justify-center text-center">
              <p>Rankings</p>
            </Button>

            <Button onClick={() => setOpenAdd(true)} variant="orange" className="w-[50%] justify-center">
              <PlusCircle className="w-4 h-4 mr-2" />
              Añadir
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-2 text-sm text-muted-foreground">
          Total de alumnos: {total} | Filtrados: {filteredAlumnos.length}
        </p>
        <div className="overflow-auto hidden md:block overflow-auto">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow>
                {[
                  "Nombre", "DNI", "Email", "Teléfono", "Sexo", "Nacimiento",
                  "Plan", "C.Pagadas", "C.Realizadas", "Inicio", "Vencimiento", "Profesor", "Acciones"
                ].map((head, i) => (
                  <TableHead key={i} className="text-center w-[7.7%]">{head}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAlumnos.map((a) => (
                <TableRow key={a.DNI}>
                  <TableCell className="text-center">{a.Nombre}</TableCell>
                  <TableCell className="text-center">{a.DNI}</TableCell>
                  <TableCell className="text-center whitespace-nowrap overflow-hidden text-ellipsis">{a.Email}</TableCell>
                  <TableCell className="text-center">{a.Telefono}</TableCell>
                  <TableCell className="text-center">{a.Sexo}</TableCell>
                  <TableCell className="text-center">{a.Fecha_nacimiento}</TableCell>
                  <TableCell className="text-center">{a.Plan}</TableCell>
                  <TableCell className="text-center">{a.Clases_pagadas}</TableCell>
                  <TableCell className="text-center">{a.Clases_realizadas}</TableCell>
                  <TableCell className="text-center">{a.Fecha_inicio}</TableCell>
                  <TableCell className="text-center">{a.Fecha_vencimiento}</TableCell>
                  <TableCell className="text-center">{a.Profesor_asignado}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button size="icon" variant="ghost" onClick={() => { setSelectedAlumno(a); setOpenEdit(true) }}>
                        <Edit className="w-4 h-4 text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => { setSelectedAlumno(a); setOpenDelete(true) }}>
                        <Trash className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-center items-center gap-4 mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              Anterior
            </Button>
            <span className="text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            >
              Siguiente
            </Button>
          </div>
        </div>

        <div className="block md:hidden space-y-4">
          {paginatedAlumnos.map((a) => (
            <Card key={a.DNI} className="shadow-sm rounded-lg overflow-hidden">
              <div className="bg-white px-4 py-3 flex justify-between items-center border-b">
                <h3 className="font-semibold text-base">{a.Nombre}</h3>
              </div>

              {/* Cuerpo con fondo gris claro */}
              <div className="bg-gray-50 px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <p className="font-bold text-gray-600">DNI</p>
                  <p className="text-gray-800">{a.DNI}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-600">Plan</p>
                  <p className="text-gray-800">{a.Plan}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-600">Profesional</p>
                  <p className="text-gray-800">{a.Profesor_asignado}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-600">Vencimiento</p>
                  <p className="text-gray-800">{a.Fecha_vencimiento}</p>
                </div>
              </div>

              <div className=" flex justify-center items-center gap-2 px-3 pb-4 bg-white">
                <Button
                  size="sm"
                  variant="orange"
                  className="w-full justify-center"
                  onClick={() => { setSelectedAlumno(a); setOpenEdit(true) }}
                >
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full justify-center"
                  onClick={() => { setSelectedAlumno(a); setOpenDelete(true) }}
                >
                  Eliminar
                </Button>
              </div>
            </Card>
          ))}

          <div className="flex justify-center items-center gap-4 mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              Anterior
            </Button>
            <span className="text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            >
              Siguiente
            </Button>
          </div>
        </div>

      </CardContent>

      <AddMemberDialog
        open={openAdd}
        onOpenChange={setOpenAdd}
        onMemberAdded={(newAlumno) => {
          setAlumnos((prev) => [...prev, newAlumno])
        }}
      />

      <RankingDialog
        open={openRanking}
        onOpenChange={setOpenRanking}
        top10Clases={topAlumnos?.top10Clases || []}
        top10Gimnasio={topAlumnos?.top10Gimnasio || []}
      />


      {selectedAlumno && (
        <>
          <EditMemberDialog
            open={openEdit}
            onOpenChange={setOpenEdit}
            member={selectedAlumno}
            onSave={(alumnoEditado: Alumno) => {
              setAlumnos((prev) =>
                prev.map((alumno) =>
                  alumno.DNI === alumnoEditado.DNI ? alumnoEditado : alumno
                )
              )
            }}
          />
          <DeleteMemberDialog
            open={openDelete}
            onOpenChange={setOpenDelete}
            member={selectedAlumno}
            onDelete={() => {
              setAlumnos((prev) => prev.filter((a) => a.DNI !== selectedAlumno?.DNI))
            }}
          />
        </>
      )}
    </Card>
  )
}
