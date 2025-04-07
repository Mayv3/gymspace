"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { DollarSign, Edit, Search, Trash, Users, PlusCircle, Clock, CreditCard } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { AddMemberDialog } from "@/components/add-member-dialog"
import { AddPaymentDialog } from "@/components/add-payment-dialog"
import { EditMemberDialog } from "@/components/edit-member-dialog"
import { DeleteMemberDialog } from "@/components/delete-member-dialog"
import { DeletePaymentDialog } from "@/components/delete-payment-dialog"
import { CashRegisterCard } from "@/components/dashboard/CashRegisterCard"
import { MembersTab } from "@/components/dashboard/MembersTab"
import { ShiftPaymentsTab } from "@/components/dashboard/ShiftPaymentsTab"
import { Member, Payment } from "@/models/dashboard"
import io from "socket.io-client";

import dayjs from 'dayjs';

export default function ReceptionistDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [cashRegisterOpen, setCashRegisterOpen] = useState(false)
  const [initialAmount, setInitialAmount] = useState("0")
  const [showAddMember, setShowAddMember] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedShift, setSelectedShift] = useState("mañana")

  const [members, setMembers] = useState<Member[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedMemberToDelete, setSelectedMemberToDelete] = useState<Member | null>(null)
  const [showDeletePaymentDialog, setShowDeletePaymentDialog] = useState(false)
  const [selectedPaymentToDelete, setSelectedPaymentToDelete] = useState<Payment | null>(null)
  
  const currentShiftPayments = payments

  const fetchMembers = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumnos`)
      const data = await res.json()
      setMembers(data)
    } catch (error) {
      console.error("Error al cargar los alumnos", error)
    }
  }

  const updateMemberAttendance = (dni: string, nuevasClases: number) => {
    setMembers((prevMembers) =>
      prevMembers.map((member) =>
        member.DNI === dni ? { ...member, Clases_realizadas: nuevasClases } : member
      )
    );
  };

  const fetchPaymentsByDateAndShift = async () => {
    try {

      const dateStr = dayjs(selectedDate).format('DD-MM-YYYY');
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pagos/fecha/${dateStr}/${selectedShift}`)
      const data = await res.json()
      setPayments(data)
    } catch (error) {
      console.error("Error al cargar pagos por turno", error)
    }
  }

  const handleUpdateMemberExpiration = (
    dni: string,
    nuevaFecha: string,
    nuevoPlan: string,
    clasesPagadas: number
  ) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.DNI === dni
          ? {
              ...m,
              Fecha_vencimiento: nuevaFecha,
              Plan: nuevoPlan,
              Clases_pagadas: clasesPagadas,
              Clases_realizadas: 0 
            }
          : m
      )
    )
  }
  
  const handleOpenCashRegister = () => {
    setCashRegisterOpen(true)
  }

  const handleCloseCashRegister = () => {
    setCashRegisterOpen(false)
    setInitialAmount("0")
  }

  const handleEditMember = (member: Member) => {
    setSelectedMember(member)
    setShowEditDialog(true)
  }

  const handleSaveMember = (updated: Member) => {
    const updatedList = members.map((member) =>
      member.DNI === updated.DNI ? updated : member
    )
    setMembers(updatedList)
    setShowEditDialog(false)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  useEffect(() => {
    fetchPaymentsByDateAndShift()
  }, [selectedDate, selectedShift])

  useEffect(() => {
    fetchMembers()
  }, [])

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001");
    socket.on("asistencia-registrada", (data) => {
      console.log("Evento asistencia-registrada recibido:", data);
      if (data && data.dni && data.clasesRealizadas !== undefined) {
        updateMemberAttendance(data.dni, data.clasesRealizadas);
      }
    });

    socket.on("asistencia-actualizada", (data) => {
      console.log("Evento asistencia-actualizada recibido:", data);
      if (data && data.dni && data.clasesRealizadas !== undefined) {
        updateMemberAttendance(data.dni, data.clasesRealizadas);
      }
    });

    return () => {
      socket.off("asistencia-registrada");
      socket.off("asistencia-actualizada");
      socket.disconnect();
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader role="Recepcionista" />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight gradient-text">GymSpace - Panel de Recepción</h2>
          <div className="flex items-center gap-2">
            {!cashRegisterOpen ? (
              <Button variant="orange" onClick={handleOpenCashRegister} className="animate-pulse-scale">
                <DollarSign className="mr-2 h-4 w-4" />
                Abrir Caja
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleCloseCashRegister}>
                <DollarSign className="mr-2 h-4 w-4" />
                Cerrar Caja
              </Button>
            )}
          </div>
        </div>

        {cashRegisterOpen && (
          <CashRegisterCard
            selectedShift={selectedShift}
            initialAmount={initialAmount}
            setInitialAmount={setInitialAmount}
            currentShiftPayments={currentShiftPayments}
          />
        )}

        <Tabs defaultValue="members" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:w-auto">
            <TabsTrigger value="members" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">
              <Users className="mr-2 h-4 w-4" />
              Miembros
            </TabsTrigger>
            <TabsTrigger
              value="shift-payments"
              className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white"
            >
              <Clock className="mr-2 h-4 w-4" />
              Pagos por Turno
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <MembersTab
              members={members}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onAddMember={() => setShowAddMember(true)}
              onEdit={handleEditMember}
              onDelete={(member) => {
                setSelectedMemberToDelete(member)
                setShowDeleteDialog(true)
              }}
            />
          </TabsContent>

          <TabsContent value="shift-payments" className="space-y-4">
            <ShiftPaymentsTab
              currentShiftPayments={currentShiftPayments}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedShift={selectedShift}
              setSelectedShift={setSelectedShift}
              setShowAddPayment={setShowAddPayment}
              formatDate={formatDate}
              setSelectedPaymentToDelete={setSelectedPaymentToDelete}
              setShowDeletePaymentDialog={setShowDeletePaymentDialog}
            />
          </TabsContent>
        </Tabs>
      </div>

      <AddMemberDialog open={showAddMember} onOpenChange={setShowAddMember} onMemberAdded={fetchMembers} />

      <AddPaymentDialog
        open={showAddPayment}
        onOpenChange={setShowAddPayment}
        onPaymentAdded={fetchPaymentsByDateAndShift}
        onMemberUpdated={handleUpdateMemberExpiration} />

      <EditMemberDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        member={selectedMember}
        onSave={handleSaveMember}
      />
      {showDeleteDialog && selectedMemberToDelete && (
        <DeleteMemberDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          member={selectedMemberToDelete}
          onDelete={(deletedDNI) => {
            setMembers((prev) => prev.filter((m) => m.DNI !== deletedDNI))
          }}
        />
      )}
      {showDeletePaymentDialog && selectedPaymentToDelete && (
        <DeletePaymentDialog
          open={showDeletePaymentDialog}
          onOpenChange={setShowDeletePaymentDialog}
          payment={selectedPaymentToDelete}
          onDelete={() => {
            fetchPaymentsByDateAndShift()
          }}
        />
      )}
    </div>
  )
}