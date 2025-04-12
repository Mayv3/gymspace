"use client"
import { useEffect, useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { formatDate } from "@/utils/dateUtils"
import { AddMemberDialog } from "@/components/dashboard/members/add-member-dialog"
import { AddPaymentDialog } from "@/components/dashboard/payments/add-payment-dialog"
import { EditMemberDialog } from "@/components/dashboard/members/edit-member-dialog"
import { DeleteMemberDialog } from "@/components/dashboard/members/delete-member-dialog"
import { DeletePaymentDialog } from "@/components/dashboard/payments/delete-payment-dialog"
import CashRegisterSection from "@/components/dashboard/cashRegister/CashRegisterSection"
import MembersSection from "@/components/dashboard/members/MemberSection"
import PaymentsSection from "@/components/dashboard/payments/PaymentSection"
import { Member, Payment } from "@/models/dashboard"
import io from "socket.io-client"
import dayjs from "dayjs"
import AssistsSection from "@/components/dashboard/assists/AssistsClases"
import { TabsContent } from "@radix-ui/react-tabs"

export default function ReceptionistDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [cashRegisterOpen, setCashRegisterOpen] = useState(false)
  const [initialAmount, setInitialAmount] = useState("0")
  const [cashRegisterId, setCashRegisterId] = useState<string | null>(null)
  const [isCajaCerrada, setIsCajaCerrada] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [showAddMember, setShowAddMember] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedMemberToDelete, setSelectedMemberToDelete] = useState<Member | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [showDeletePaymentDialog, setShowDeletePaymentDialog] = useState(false)
  const [selectedPaymentToDelete, setSelectedPaymentToDelete] = useState<Payment | null>(null)
  const currentShiftPayments = payments
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedShift, setSelectedShift] = useState("mañana")

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
    setMembers(prev =>
      prev.map(member =>
        member.DNI === dni ? { ...member, Clases_realizadas: nuevasClases } : member
      )
    )
  }
  const fetchPaymentsByDateAndShift = async () => {
    try {
      const dateStr = dayjs(selectedDate).format("DD-MM-YYYY")
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
    setMembers(prev =>
      prev.map(m =>
        m.DNI === dni
          ? { ...m, Fecha_vencimiento: nuevaFecha, Plan: nuevoPlan, Clases_pagadas: clasesPagadas, Clases_realizadas: 0 }
          : m
      )
    )
  }
  const handleOpenCashRegister = async () => {
    try {
      const requestBody: any = { turno: selectedShift, responsable: "DANI" }
      if (selectedShift === "mañana") {
        requestBody.saldoInicial = initialAmount
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/caja/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      })
      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error al abrir caja:", errorData.message)
        return
      }
      const data = await response.json()
      setInitialAmount(data.saldoInicial)
      setCashRegisterId(data.id)
      setPayments([])
      setCashRegisterOpen(true)
      setIsCajaCerrada(false)
    } catch (error) {
      console.error("Error al abrir caja:", error)
    }
  }
  const handleCloseCashRegister = async () => {
    try {
      if (!cashRegisterId) return
      const horaCierre = dayjs().format("HH:mm")
      const parsedInitial = parseFloat(initialAmount) || 0
      const totalPagos = payments.reduce((sum, p) => sum + Number(p.Monto || 0), 0)
      const totalFinal = parsedInitial + totalPagos
      const totalEfectivo = payments.filter(p => p.Metodo_de_Pago === "Efectivo")
        .reduce((sum, p) => sum + Number(p.Monto || 0), 0)
      const totalTarjeta = payments.filter(p => p.Metodo_de_Pago === "Tarjeta")
        .reduce((sum, p) => sum + Number(p.Monto || 0), 0)
      const nuevosDatos = {
        "Hora Cierre": horaCierre,
        "Total Efectivo": String(totalEfectivo),
        "Total Tarjeta": String(totalTarjeta),
        "Total Final": String(totalFinal)
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/caja/${cashRegisterId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevosDatos)
      })
      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error al cerrar caja:", errorData.message)
        return
      }
      await response.json()
      setCashRegisterOpen(false)
      setInitialAmount("0")
      setCashRegisterId(null)
      setPayments([])
      localStorage.setItem("cajaCerrada", "true")
      setIsCajaCerrada(true)
    } catch (error) {
      console.error("Error al cerrar caja:", error)
    }
  }
  const handleEditMember = (member: Member) => {
    setSelectedMember(member)
    setShowEditDialog(true)
  }
  const handleSaveMember = (updated: Member) => {
    setMembers(prev => prev.map(m => (m.DNI === updated.DNI ? updated : m)))
    setShowEditDialog(false)
  }
  const handleShowAddPayment = () => {
    if (cashRegisterOpen) setShowAddPayment(true)
  }
  useEffect(() => {
    fetchPaymentsByDateAndShift();
  }, [selectedDate, selectedShift]);
  useEffect(() => {
    fetchMembers();
    const closedFlag = localStorage.getItem("cajaCerrada") === "true";
    if (closedFlag) {
      setCashRegisterOpen(false);
      setInitialAmount("0");
      setIsCajaCerrada(true);
    }
  }, []);
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001");
    socket.on("nuevo-pago", data => {
      if (cashRegisterOpen) {
        setPayments(prev => [...prev, data]);
      }
    });
    socket.on("asistencia-registrada", data => {
      if (data?.dni && data?.clasesRealizadas !== undefined) {
        updateMemberAttendance(data.dni, data.clasesRealizadas);
      }
    });
    socket.on("asistencia-actualizada", data => {
      if (data?.dni && data?.clasesRealizadas !== undefined) {
        updateMemberAttendance(data.dni, data.clasesRealizadas);
      }
    });
    return () => {
      socket.off("nuevo-pago");
      socket.off("asistencia-registrada");
      socket.off("asistencia-actualizada");
      socket.disconnect();
    };
  }, [cashRegisterOpen]);

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader role="Recepcionista" />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <CashRegisterSection
          cashRegisterOpen={cashRegisterOpen}
          initialAmount={initialAmount}
          selectedShift={selectedShift}
          currentShiftPayments={currentShiftPayments}
          onOpenCashRegister={handleOpenCashRegister}
          onCloseCashRegister={handleCloseCashRegister}
          setInitialAmount={setInitialAmount}
        />
        {!cashRegisterOpen && isCajaCerrada && (
          <div className="text-center text-xl font-bold text-gray-600">
            La caja se ha cerrado
          </div>
        )}
        <Tabs defaultValue="members" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 md:w-auto">
            <TabsTrigger value="members" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">
              Miembros
            </TabsTrigger>
            <TabsTrigger value="shift-payments" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">
              Pagos por Turno
            </TabsTrigger>
            <TabsTrigger value="assists" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">
              Asistencias
            </TabsTrigger>
          </TabsList>

          <MembersSection
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

          <PaymentsSection
            currentShiftPayments={currentShiftPayments}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedShift={selectedShift}
            setSelectedShift={setSelectedShift}
            onShowAddPayment={handleShowAddPayment}
            formatDate={formatDate}
            setSelectedPaymentToDelete={setSelectedPaymentToDelete}
            setShowDeletePaymentDialog={setShowDeletePaymentDialog}
            onMemberUpdated={handleUpdateMemberExpiration}
            refreshPayments={fetchPaymentsByDateAndShift}
          />

          <TabsContent value="assists" className="space-y-4">
            <AssistsSection />
          </TabsContent>
        </Tabs>
      </div>
      <AddMemberDialog open={showAddMember} onOpenChange={setShowAddMember} onMemberAdded={fetchMembers} />
      <AddPaymentDialog
        open={showAddPayment}
        onOpenChange={setShowAddPayment}
        onPaymentAdded={fetchPaymentsByDateAndShift}
        onMemberUpdated={handleUpdateMemberExpiration}
      />
      <EditMemberDialog open={showEditDialog} onOpenChange={setShowEditDialog} member={selectedMember} onSave={handleSaveMember} />

      {showDeleteDialog && selectedMemberToDelete && (
        <DeleteMemberDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          member={selectedMemberToDelete}
          onDelete={(deletedDNI) => {
            setMembers(prev => prev.filter(m => m.DNI !== deletedDNI))
          }}
        />
      )}
      {showDeletePaymentDialog && selectedPaymentToDelete && (
        <DeletePaymentDialog
          open={showDeletePaymentDialog}
          onOpenChange={setShowDeletePaymentDialog}
          payment={selectedPaymentToDelete}
          onDelete={() => { fetchPaymentsByDateAndShift() }}
        />
      )}
    </div>
  )
}
