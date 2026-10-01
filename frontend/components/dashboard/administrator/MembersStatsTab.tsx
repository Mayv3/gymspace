import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, Trash, PlusCircle, CoinsIcon, MoreVertical } from "lucide-react"

import { AddMemberDialog } from "@/components/dashboard/recepcionist/members/add-member-dialog"
import { EditMemberDialog } from "@/components/dashboard/recepcionist/members/edit-member-dialog"
import { DeleteMemberDialog } from "@/components/dashboard/recepcionist/members/delete-member-dialog"
import { useAppData } from "@/context/AppDataContext"
import { useMembersList } from "@/hooks/useMembersList"
import { Member } from "@/models/dashboard"
import { RankingDialog } from "../recepcionist/members/Ranking-dialog"
import { PuntosModal } from "../recepcionist/members/details-member"

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
  onMemberAdded: (newMember: Member) => void;
  topAlumnos: {
    top10Clases: any[];
    top10Gimnasio: any[];
  };
}

export function MembersStatsTab({ onMemberAdded, topAlumnos }: MembersStatsTabProps) {
  const { refreshMembers } = useAppData()

  const [sexo, setSexo] = useState("")
  const [edadMin, setEdadMin] = useState("")
  const [edadMax, setEdadMax] = useState("")
  const [profe, setProfe] = useState("")
  const [plan, setPlan] = useState("")
  const [nombre, setNombre] = useState("")
  const [dniHistorial, setDniHistorial] = useState<string | null>(null)
  const [nombreHistorial, setNombreHistorial] = useState<string>("")

  const [selectedAlumno, setSelectedAlumno] = useState<Alumno | null>(null)
  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [openRanking, setOpenRanking] = useState(false)

  const { planes } = useAppData();

  // Filtros, edad y paginación los resuelve el servidor (de a 10)
  const {
    members: paginatedAlumnos,
    total: totalFiltrados,
    totalGeneral: total,
    page: currentPage,
    setPage: setCurrentPage,
    totalPages,
  } = useMembersList<Alumno>({ sexo, edadMin, edadMax, profe, plan, nombre }, { conTotalGeneral: true })

  return (
    <Card className="rounded-2xl border-border/60 shadow-soft overflow-hidden">
      <CardHeader className="bg-brand-50 dark:bg-zinc-900 rounded-t-2xl mb-4 border-b border-border/60">
        <CardTitle className="pb-3 font-bold">Estadísticas de Alumnos</CardTitle>
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
              <label className="text-sm font-bold">Edad mínima: {edadMin || 0}</label>
              <input
                type="range"
                min={0}
                max={100}
                value={edadMin}
                onChange={(e) => setEdadMin(e.target.value)}
                className="w-full md:w-[150px] accent-brand-500"
              />
            </div>

            <div className="flex flex-col items-start mt-3 md:mt-0">
              <label className="text-sm font-bold">Edad máxima: {edadMax || 100}</label>
              <input
                type="range"
                min={0}
                max={100}
                value={edadMax}
                onChange={(e) => setEdadMax(e.target.value)}
                className="w-full md:w-[150px] accent-brand-500"
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
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          Total de alumnos: {total} | Filtrados: {totalFiltrados}
        </p>
        <div className="overflow-auto hidden md:block rounded-2xl border border-border/60">
          <Table className="w-full">
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b">
                {[
                  { label: "Nombre", cls: "" },
                  { label: "DNI", cls: "" },
                  { label: "Email", cls: "hidden 2xl:table-cell" },
                  { label: "Teléfono", cls: "hidden xl:table-cell" },
                  { label: "Plan", cls: "" },
                  { label: "C.Pagadas", cls: "hidden lg:table-cell" },
                  { label: "C.Realizadas", cls: "hidden lg:table-cell" },
                  { label: "Inicio", cls: "hidden xl:table-cell" },
                  { label: "Vencimiento", cls: "" },
                  { label: "Profesor", cls: "hidden lg:table-cell" },
                  { label: "Acciones", cls: "" },
                ].map((head, i) => (
                  <TableHead key={i} className={`text-center px-3 text-[11px] uppercase tracking-wider font-bold text-muted-foreground ${head.cls}`}>{head.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/60">
              {paginatedAlumnos.map((a) => (
                <TableRow key={a.DNI} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="text-center px-3">{a.Nombre}</TableCell>
                  <TableCell className="text-center px-3 whitespace-nowrap">{a.DNI}</TableCell>
                  <TableCell className="text-center px-3 hidden 2xl:table-cell">
                    <div className="max-w-[160px] mx-auto whitespace-nowrap overflow-hidden text-ellipsis" title={a.Email}>{a.Email}</div>
                  </TableCell>
                  <TableCell className="text-center px-3 whitespace-nowrap hidden xl:table-cell">{a.Telefono}</TableCell>
                  <TableCell className="text-center px-3">
                    <div className="max-w-[120px] mx-auto whitespace-nowrap overflow-hidden text-ellipsis" title={a.Plan}>{a.Plan}</div>
                  </TableCell>
                  <TableCell className="text-center px-3 hidden lg:table-cell">{a.Clases_pagadas}</TableCell>
                  <TableCell className="text-center px-3 hidden lg:table-cell">{a.Clases_realizadas}</TableCell>
                  <TableCell className="text-center px-3 whitespace-nowrap hidden xl:table-cell">{a.Fecha_inicio}</TableCell>
                  <TableCell className="text-center px-3 whitespace-nowrap">{a.Fecha_vencimiento}</TableCell>
                  <TableCell className="text-center px-3 hidden lg:table-cell">
                    <div className="max-w-[100px] mx-auto whitespace-nowrap overflow-hidden text-ellipsis" title={a.Profesor_asignado}>{a.Profesor_asignado}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="rounded-full" aria-label="Acciones">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl shadow-floating">
                        <DropdownMenuItem
                          className="cursor-pointer rounded-lg font-medium"
                          onClick={() => { setSelectedAlumno(a); setOpenEdit(true) }}
                        >
                          <Edit className="w-4 h-4 mr-2 text-brand-500" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer rounded-lg font-medium"
                          onClick={() => {
                            setDniHistorial(a.DNI)
                            setNombreHistorial(a.Nombre)
                          }}
                        >
                          <CoinsIcon className="w-4 h-4 mr-2 text-amber-500" />
                          GymCoins
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer rounded-lg font-medium text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                          onClick={() => { setSelectedAlumno(a); setOpenDelete(true) }}
                        >
                          <Trash className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
            <Card key={a.DNI} className="shadow-soft rounded-2xl overflow-hidden bg-card border-border/60">
              <div className="bg-card px-4 py-3 flex justify-between items-center border-b border-border/60">
                <h3 className="font-bold text-base text-foreground">{a.Nombre}</h3>
              </div>

              <div className="bg-muted/40 px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <p className="font-bold text-muted-foreground">DNI</p>
                  <p className="font-medium text-foreground">{a.DNI}</p>
                </div>
                <div>
                  <p className="font-bold text-muted-foreground">Plan</p>
                  <p className="font-medium text-foreground">{a.Plan}</p>
                </div>
                <div>
                  <p className="font-bold text-muted-foreground">Profesional</p>
                  <p className="font-medium text-foreground">{a.Profesor_asignado}</p>
                </div>
                <div>
                  <p className="font-bold text-muted-foreground">Vencimiento</p>
                  <p className="font-medium text-foreground">{a.Fecha_vencimiento}</p>
                </div>
              </div>

              <div className="flex justify-center items-center gap-2 px-3 pb-4 pt-3 bg-card">
                <Button
                  size="sm"
                  variant="orange"
                  className="w-1/3 justify-center"
                  onClick={() => { setSelectedAlumno(a); setOpenEdit(true) }}
                >
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-1/3 justify-center"
                  onClick={() => { setSelectedAlumno(a); setOpenDelete(true) }}
                >
                  Eliminar
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-1/3 justify-center rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40"
                  onClick={() => {
                    setDniHistorial(a.DNI)
                    setNombreHistorial(a.Nombre)
                  }}
                >
                  <CoinsIcon className="h-4 w-4 text-yellow-500" />
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

      {dniHistorial && (
        <PuntosModal
          dni={dniHistorial}
          nombre={nombreHistorial}
          open={!!dniHistorial}
          onClose={() => setDniHistorial(null)}
        />
      )}

      <AddMemberDialog
        open={openAdd}
        onOpenChange={setOpenAdd}
        onMemberAdded={() => refreshMembers()}
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
            onSave={() => refreshMembers()}
          />
          <DeleteMemberDialog
            open={openDelete}
            onOpenChange={setOpenDelete}
            member={selectedAlumno}
            onDelete={() => refreshMembers()}
          />
        </>
      )}
    </Card>
  )
}
