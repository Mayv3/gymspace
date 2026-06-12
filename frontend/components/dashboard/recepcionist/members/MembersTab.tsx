import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Edit, Trash, PlusCircle, History, CoinsIcon } from "lucide-react"
import { motion } from "framer-motion"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"
import { useState, useEffect } from "react"
import { PuntosModal } from "./details-member"

import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import { RankingDialog } from "./Ranking-dialog"
import axios from "axios"
dayjs.extend(customParseFormat)
dayjs.extend(isSameOrBefore)

interface Member {
  id: string
  Nombre: string
  DNI: string
  Email: string
  Telefono: string
  Clases_pagadas: number
  Clases_realizadas: number
  Fecha_inicio: string
  Fecha_vencimiento: string
  Fecha_nacimiento: string
  Plan: string
  Profesor_asignado: string
  GymCoins: string
}

interface TopAlumno {
  Nombre: string
  GymCoins: number
}

interface TopAlumnosResponse {
  top10Clases: TopAlumno[]
  top10Gimnasio: TopAlumno[]
}

interface MembersTabProps {
  members: Member[]
  searchTerm: string
  setSearchTerm: (value: string) => void
  onEdit: (member: Member) => void
  onDelete: (member: Member) => void
  onAddMember: () => void
}

export function MembersTab({ members, searchTerm, setSearchTerm, onEdit, onDelete, onAddMember }: MembersTabProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchProfe, setSearchProfe] = useState("")

  const itemsPerPage = 10
  const [dniHistorial, setDniHistorial] = useState<string | null>(null)
  const [nombreHistorial, setNombreHistorial] = useState<string>("")
  const [openRanking, setOpenRanking] = useState(false)
  const [topAlumnosCoins, setTopAlumnosCoins] = useState<TopAlumnosResponse | null>(null)
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      (member.Nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.Email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.DNI || "").includes(searchTerm) ||
      (member.Plan || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProfe =
      !searchProfe ||
      (member.Profesor_asignado || "").toLowerCase().includes(searchProfe.toLowerCase());

    return matchesSearch && matchesProfe;
  });

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedMembers = filteredMembers.slice(startIndex, endIndex)

  const totalMembers = filteredMembers.length

  const fetchTopAlumnos = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumnos/topAlumnosCoins`)
      setTopAlumnosCoins(res.data)
      console.log(res.data)
    } catch (err) {
      console.error("Error fetching user:", err)
    }
  }

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm])


  useEffect(() => {
    fetchTopAlumnos()
  }, [])



  return (
    <Card className="bg-card rounded-2xl border border-border/60 shadow-soft">
      <CardHeader className="flex flex-column gap-3 md:flex-row md:gap-1 border-b border-border/60 mb-4 items-center justify-between">
        <div>
          <CardTitle className="font-bold">Gestión de Miembros</CardTitle>
          <CardDescription className="hidden md:block text-xs text-muted-foreground font-medium">Ver y editar información de miembros.</CardDescription>
        </div>
        <div className="flex gap-2 ">
          <Button onClick={() => setOpenRanking(true)} variant="orange" className="w-[50%] justify-center text-center bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-brand-btn btn-press">
            <p>Rankings</p>
          </Button>
          <Button variant="orange" onClick={onAddMember} className="bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-brand-btn btn-press">
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Miembro
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-row md:flex-row items-center gap-2 mb-4">
          <div className="flex items-center  gap-2 w-full md:w-auto">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar miembros..."
              className="max-w-sm rounded-xl border-input focus-visible:border-brand-500 focus-visible:ring-4 focus-visible:ring-brand-500/10 focus-visible:ring-offset-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Input
              placeholder="Filtrar por profesor..."
              className="max-w-sm rounded-xl border-input focus-visible:border-brand-500 focus-visible:ring-4 focus-visible:ring-brand-500/10 focus-visible:ring-offset-0"
              value={searchProfe}
              onChange={(e) => setSearchProfe(e.target.value)}
            />
          </div>
          <div className="flex items-center text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 h-10 rounded-xl border border-border bg-card shadow-soft">
              <span className="text-muted-foreground font-medium">Total:</span>
              <span className="text-foreground font-bold">{totalMembers}</span>
            </div>
          </div>
        </div>
        <div className="hidden md:block rounded-2xl border border-border/60 overflow-auto max-w-[calc(100vw-2rem)]">
          <div>
            <Table className="w-full">
              <TableHeader className="bg-muted/50">
                <TableRow className="border-b">
                  {[
                    { label: "Nombre", cls: "" },
                    { label: "DNI", cls: "" },
                    { label: "Email", cls: "hidden 2xl:table-cell" },
                    { label: "Teléfono", cls: "hidden xl:table-cell" },
                    { label: "Vencimiento", cls: "" },
                    { label: "Plan", cls: "" },
                    { label: "Profesor", cls: "hidden lg:table-cell" },
                    { label: "Estado", cls: "" },
                    { label: "GymCoins", cls: "hidden lg:table-cell" },
                    { label: "Acciones", cls: "" },
                  ].map((head, i) => (
                    <TableHead key={i} className={`text-center px-3 text-[11px] uppercase tracking-wider font-bold text-muted-foreground ${head.cls}`}>{head.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/60">
                {paginatedMembers.map((member, index) => (
                  <motion.tr
                    key={member.DNI}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="text-center px-3">{member.Nombre}</TableCell>
                    <TableCell className="text-center px-3 whitespace-nowrap">{member.DNI}</TableCell>
                    <TableCell className="text-center px-3 hidden 2xl:table-cell">
                      <div className="max-w-[160px] mx-auto whitespace-nowrap overflow-hidden text-ellipsis" title={member.Email}>
                        {member.Email}
                      </div>
                    </TableCell>
                    <TableCell className="text-center px-3 whitespace-nowrap hidden xl:table-cell">{member.Telefono}</TableCell>
                    <TableCell className="text-center px-3 whitespace-nowrap">{member.Fecha_vencimiento}</TableCell>

                    <TableCell className="text-center px-3">
                      <div className="max-w-[120px] mx-auto whitespace-nowrap overflow-hidden text-ellipsis" title={member.Plan}>{member.Plan}</div>
                    </TableCell>
                    <TableCell className="text-center px-3 hidden lg:table-cell">
                      <div className="max-w-[100px] mx-auto whitespace-nowrap overflow-hidden text-ellipsis" title={member.Profesor_asignado}>
                        {member.Profesor_asignado}
                      </div>
                    </TableCell>
                    <TableCell className="text-center px-3">
                      {(() => {
                        const hoy = dayjs();
                        const fechaVencimiento = dayjs(member.Fecha_vencimiento, ["D/M/YYYY", "DD/MM/YYYY"]);

                        const clasesPagadas = Number(member.Clases_pagadas);
                        const clasesRealizadas = Number(member.Clases_realizadas);

                        if (fechaVencimiento.isValid() && fechaVencimiento.isSameOrBefore(hoy, 'day')) {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Expirado
                            </span>
                          );
                        } else if (
                          clasesPagadas > 0 &&
                          clasesRealizadas >= clasesPagadas
                        ) {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Límite
                            </span>
                          );
                        } else {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Activo
                            </span>
                          );
                        }
                      })()}
                    </TableCell>
                    <TableCell className="text-center px-3 hidden lg:table-cell">{member.GymCoins}</TableCell>
                    <TableCell className="text-center px-3">
                      <div className="flex justify-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => onEdit(member)}>
                          <Edit className="h-4 w-4 text-brand-500" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => onDelete(member)}>
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setDniHistorial(member.DNI)
                            setNombreHistorial(member.Nombre)
                          }}
                        >
                          <CoinsIcon className="h-4 w-4 text-amber-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="block md:hidden space-y-4">
          {paginatedMembers.map((m, idx) => (
            <Card key={m.DNI} className="bg-card shadow-soft rounded-2xl border border-border/60 overflow-hidden">
              <div className="bg-muted/40 px-4 py-3 flex justify-between items-center border-b border-border/60">
                <h3 className="font-bold text-base">{m.Nombre}</h3>
                {(() => {
                  const hoy = dayjs();
                  const venc = dayjs(m.Fecha_vencimiento, ["D/M/YYYY", "DD/MM/YYYY"]);
                  if (venc.isValid() && venc.isSameOrBefore(hoy, "day")) {
                    return (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Expirado
                      </span>
                    );
                  }
                  if (+m.Clases_realizadas >= +m.Clases_pagadas) {
                    return (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Límite
                      </span>
                    );
                  }
                  return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Activo
                    </span>
                  );
                })()}
              </div>

              <CardContent className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <p className="font-bold text-foreground">DNI</p>
                  <p className="text-muted-foreground">{m.DNI}</p>
                </div>
                <div>
                  <p className="font-bold text-foreground">Email</p>
                  <p className="text-muted-foreground truncate">{m.Email}</p>
                </div>
                <div>
                  <p className="font-bold text-foreground">Teléfono</p>
                  <p className="text-muted-foreground">{m.Telefono}</p>
                </div>
                <div>
                  <p className="font-bold text-foreground">Nac.</p>
                  <p className="text-muted-foreground">{m.Fecha_nacimiento}</p>
                </div>
                <div>
                  <p className="font-bold text-foreground">Inicio</p>
                  <p className="text-muted-foreground">{m.Fecha_inicio}</p>
                </div>
                <div>
                  <p className="font-bold text-foreground">Venc.</p>
                  <p className="text-muted-foreground">{m.Fecha_vencimiento}</p>
                </div>
                <div>
                  <p className="font-bold text-foreground">Pagadas</p>
                  <p className="text-muted-foreground">{m.Clases_pagadas}</p>
                </div>
                <div>
                  <p className="font-bold text-foreground">Realizadas</p>
                  <p className="text-muted-foreground">{m.Clases_realizadas}</p>
                </div>
                <div>
                  <p className="font-bold text-foreground">Profesor</p>
                  <p className="text-muted-foreground">{m.Profesor_asignado}</p>
                </div>
                <div>
                  <p className="font-bold text-foreground">Plan</p>
                  <p className="text-sm text-muted-foreground">{m.Plan}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-bold text-foreground">GymCoins</p>
                  <p className="text-muted-foreground">{m.GymCoins}</p>
                </div>
              </CardContent>

              <div className="px-4 py-3 space-y-2 flex items-end gap-2">
                <Button
                  size="sm"
                  variant="orange"
                  className="w-1/3 justify-center bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-brand-btn btn-press"
                  onClick={() => onEdit(m)}
                >
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-1/3 justify-center font-bold rounded-xl"
                  onClick={() => onDelete(m)}
                >
                  Eliminar
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-1/3 justify-center rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:border-amber-900"
                  onClick={() => {
                    setDniHistorial(m.DNI)
                    setNombreHistorial(m.Nombre)
                  }}
                >
                  <CoinsIcon className="h-4 w-4 text-amber-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
        {dniHistorial && (
          <PuntosModal
            dni={dniHistorial}
            nombre={nombreHistorial}
            open={!!dniHistorial}
            onClose={() => setDniHistorial(null)}
          />
        )}
        {filteredMembers.length > itemsPerPage && (
          <div className="flex justify-center mt-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-card border border-border rounded-xl font-bold hover:bg-muted"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="flex items-center px-2 text-sm font-medium">
              {currentPage} / {Math.ceil(filteredMembers.length / itemsPerPage)}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="bg-card border border-border rounded-xl font-bold hover:bg-muted"
              onClick={() =>
                setCurrentPage((p) =>
                  p < Math.ceil(filteredMembers.length / itemsPerPage) ? p + 1 : p
                )
              }
              disabled={currentPage >= Math.ceil(filteredMembers.length / itemsPerPage)}
            >
              Siguiente
            </Button>
          </div>
        )}
      </CardContent>
      <RankingDialog
        open={openRanking}
        onOpenChange={setOpenRanking}
        top10Clases={topAlumnosCoins?.top10Clases || []}
        top10Gimnasio={topAlumnosCoins?.top10Gimnasio || []}
      />
    </Card>
  )
}