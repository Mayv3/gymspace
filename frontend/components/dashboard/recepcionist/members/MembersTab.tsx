import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Edit, Trash, PlusCircle, History, CoinsIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"
import { useState, useEffect } from "react"
import { PuntosModal } from "./details-member"

import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
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
  const itemsPerPage = 10
  const [dniHistorial, setDniHistorial] = useState<string | null>(null)
  const [nombreHistorial, setNombreHistorial] = useState<string>("")

  const filteredMembers = members.filter((member) =>
    (member.Nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.Email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.Profesor_asignado || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.DNI || "").includes(searchTerm) ||
    (member.Plan || "").includes(searchTerm)
  )

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedMembers = filteredMembers.slice(startIndex, endIndex)


  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  return (
    <Card>
      <CardHeader className="flex flex-row bg-orange-50  dark:bg-zinc-900 mb-4 items-center justify-between">
        <div>
          <CardTitle>Gestión de Miembros</CardTitle>
          <CardDescription className="hidden md:block">Ver y editar información de miembros.</CardDescription>
        </div>
        <Button variant="orange" onClick={onAddMember}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Miembro
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar miembros..."
            className="max-w-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="hidden md:block rounded-md border overflow-auto max-w-[calc(100vw-2rem)]">
          <div className="min-w-[800px]">
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow>
                  {[
                    "Nombre", "DNI", "Email", "Teléfono", "C.Pagadas", "C.Realizadas",
                    "Inicio", "Vencimiento", "Nacimiento", "Plan", "Profesor", "Estado", "GymCoins", "Acciones"
                  ].map((head, i) => (
                    <TableHead key={i} className="text-center w-[7.7%]">{head}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMembers.map((member, index) => (
                  <motion.tr
                    key={member.DNI}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="hover:bg-accent"
                  >
                    <TableCell className="text-center">{member.Nombre}</TableCell>
                    <TableCell className="text-center">{member.DNI}</TableCell>
                    <TableCell className="text-center whitespace-nowrap overflow-hidden text-ellipsis">{member.Email}</TableCell>
                    <TableCell className="text-center">{member.Telefono}</TableCell>
                    <TableCell className="text-center">{member.Clases_pagadas}</TableCell>
                    <TableCell className="text-center">{member.Clases_realizadas}</TableCell>
                    <TableCell className="text-center">{member.Fecha_inicio}</TableCell>
                    <TableCell className="text-center">{member.Fecha_vencimiento}</TableCell>
                    <TableCell className="text-center">{member.Fecha_nacimiento}</TableCell>
                    <TableCell className="text-center">{member.Plan}</TableCell>
                    <TableCell className="text-center">{member.Profesor_asignado}</TableCell>
                    <TableCell className="text-center">
                      {(() => {
                        const hoy = dayjs();
                        const fechaVencimiento = dayjs(member.Fecha_vencimiento, ["D/M/YYYY", "DD/MM/YYYY"]);

                        const clasesPagadas = Number(member.Clases_pagadas);
                        const clasesRealizadas = Number(member.Clases_realizadas);

                        if (fechaVencimiento.isValid() && fechaVencimiento.isSameOrBefore(hoy, 'day')) {
                          return (
                            <Badge variant="destructive" className="animate-pulse-scale">
                              Expirado
                            </Badge>
                          );
                        } else if (
                          clasesPagadas > 0 &&
                          clasesRealizadas >= clasesPagadas
                        ) {
                          return (
                            <Badge variant="destructive" className="animate-pulse-scale">
                              Límite
                            </Badge>
                          );
                        } else {
                          return (
                            <Badge variant="success" className="animate-pulse-scale">
                              Activo
                            </Badge>
                          );
                        }
                      })()}
                    </TableCell>
                    <TableCell className="text-center">{member.GymCoins}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button size="icon" variant="ghost" onClick={() => onEdit(member)}>
                          <Edit className="h-4 w-4 text-primary" />
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
                          <CoinsIcon className="h-4 w-4 text-yellow-500" />
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
            <Card key={m.DNI} className="shadow-sm rounded-lg overflow-hidden">
              <div className="bg-white px-4 py-3 flex justify-between items-center border-b">
                <h3 className="font-semibold text-base">{m.Nombre}</h3>
                {(() => {
                  const hoy = dayjs();
                  const venc = dayjs(m.Fecha_vencimiento, ["D/M/YYYY", "DD/MM/YYYY"]);
                  if (venc.isValid() && venc.isSameOrBefore(hoy, "day")) {
                    return <Badge variant="destructive">Expirado</Badge>;
                  }
                  if (+m.Clases_realizadas >= +m.Clases_pagadas) {
                    return <Badge variant="destructive">Límite</Badge>;
                  }
                  return <Badge variant="success">Activo</Badge>;
                })()}
              </div>

              {/* Cuerpo: grid 2 cols */}
              <CardContent className="bg-gray-50 px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <p className="font-bold text-gray-600">DNI</p>
                  <p className="text-gray-800">{m.DNI}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-600">Email</p>
                  <p className="text-gray-800 truncate">{m.Email}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-600">Teléfono</p>
                  <p className="text-gray-800">{m.Telefono}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-600">Nac.</p>
                  <p className="text-gray-800">{m.Fecha_nacimiento}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-600">Inicio</p>
                  <p className="text-gray-800">{m.Fecha_inicio}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-600">Venc.</p>
                  <p className="text-gray-800">{m.Fecha_vencimiento}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-600">Pagadas</p>
                  <p className="text-gray-800">{m.Clases_pagadas}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-600">Realizadas</p>
                  <p className="text-gray-800">{m.Clases_realizadas}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-600">Profesor</p>
                  <p className="text-gray-800">{m.Profesor_asignado}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-600">Plan</p>
                  <p className="text-sm text-gray-800">{m.Plan}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-bold text-gray-600">GymCoins</p>
                  <p className="text-gray-800">{m.GymCoins}</p>
                </div>
              </CardContent>

              <div className="bg-white px-4 py-3 space-y-2 flex items-end gap-2">
                <Button
                  size="sm"
                  variant="orange"
                  className="w-1/3 justify-center"
                  onClick={() => onEdit(m)}
                >
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-1/3 justify-center"
                  onClick={() => onDelete(m)}
                >
                  Eliminar
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-1/3 justify-center bg-yellow-200"
                  onClick={() => {
                    setDniHistorial(m.DNI)
                    setNombreHistorial(m.Nombre)
                  }}
                >
                  <CoinsIcon className="h-4 w-4 text-yellow-500" />
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
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="flex items-center px-2 text-sm">
              {currentPage} / {Math.ceil(filteredMembers.length / itemsPerPage)}
            </span>
            <Button
              variant="outline"
              size="sm"
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
    </Card>
  )
}