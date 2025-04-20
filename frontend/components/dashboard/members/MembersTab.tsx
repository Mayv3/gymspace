import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Edit, Trash, PlusCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
dayjs.extend(customParseFormat)

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
  const filteredMembers = members.filter((member) =>
    member.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.Email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.Profesor_asignado.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.DNI.includes(searchTerm) ||
    member.Plan.includes(searchTerm)
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gestión de Miembros</CardTitle>
          <CardDescription>Ver y editar información de miembros.</CardDescription>
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
        <div className="rounded-md border overflow-auto max-w-[calc(100vw-2rem)]">
          <div className="min-w-[800px]">
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow>
                  {["Nombre", "DNI", "Email", "Teléfono", "C.Pagadas", "C.Realizadas", "Inicio", "Vencimiento", "Nacimiento", "Plan", "Profesor", "Estado", "Acciones"].map((head, i) => (
                    <TableHead key={i} className="w-[7.7%]">{head}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member, index) => (
                  <motion.tr
                    key={member.DNI}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="hover:bg-accent"
                  >
                    <TableCell>{member.Nombre}</TableCell>
                    <TableCell>{member.DNI}</TableCell>
                    <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">{member.Email}</TableCell>
                    <TableCell>{member.Telefono}</TableCell>
                    <TableCell>{member.Clases_pagadas}</TableCell>
                    <TableCell>{member.Clases_realizadas}</TableCell>
                    <TableCell>{member.Fecha_inicio} </TableCell>
                    <TableCell>{member.Fecha_vencimiento}</TableCell>
                    <TableCell>{member.Fecha_nacimiento}</TableCell>
                    <TableCell>{member.Plan}</TableCell>
                    <TableCell>{member.Profesor_asignado}</TableCell>
                    <TableCell>
                      {(() => {
                        const hoy = dayjs();
                        const fechaVencimiento = dayjs(member.Fecha_vencimiento, "DD/MM/YYYY");
                        if (fechaVencimiento.isValid() && fechaVencimiento.isBefore(hoy, 'day')) {
                          return (
                            <Badge variant="destructive" className="animate-pulse-scale">
                              Expirado
                            </Badge>
                          );
                        } else if (member.Clases_realizadas >= member.Clases_pagadas) {
                          return (
                            <Badge variant="destructive" className="animate-pulse-scale">
                              Faso
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

                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => onEdit(member)}>
                          <Edit className="h-4 w-4 text-primary" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => onDelete(member)}>
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}