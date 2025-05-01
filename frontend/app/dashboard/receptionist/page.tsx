"use client"
import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { formatDate } from "@/utils/dateUtils"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import MembersSection from "@/components/dashboard/recepcionist/members/MemberSection"
import PaymentsSection from "@/components/dashboard/recepcionist/payments/PaymentSection"
import AssistsSection from "@/components/dashboard/recepcionist/assists/AssistsClases"
import PlansSection from "@/components/dashboard/recepcionist/plans/PlansSection"
import ShiftsSection from "@/components/dashboard/recepcionist/shifts/ShiftSection"
import CashRegisterSection from "@/components/dashboard/recepcionist/cashRegister/CashRegisterSection"

import { AddMemberDialog } from "@/components/dashboard/recepcionist/members/add-member-dialog"
import { EditMemberDialog } from "@/components/dashboard/recepcionist/members/edit-member-dialog"
import { DeleteMemberDialog } from "@/components/dashboard/recepcionist/members/delete-member-dialog"
import { AddPaymentDialog } from "@/components/dashboard/recepcionist/payments/add-payment-dialog"
import { DeletePaymentDialog } from "@/components/dashboard/recepcionist/payments/delete-payment-dialog"

import { useUser } from "@/context/UserContext"
import { useRouter } from "next/navigation"

import { useMembers } from "@/hooks/useMember"
import { usePayments } from "@/hooks/usePayments"
import { useCashRegister } from "@/hooks/useCashRegister"
import { useDialogManager } from "@/hooks/useDialogManager"
import { useAppData } from "@/context/AppDataContext"

import { Member } from "@/models/dashboard";
import EgresosSection from "@/components/dashboard/recepcionist/egresos/EgresosSection"

export default function ReceptionistDashboard() {
  const { user, loading } = useUser()
  const router = useRouter()

  const { fetchMembers, updateAttendance } = useMembers()
  const { alumnos } = useAppData();
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("")

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedShift, setSelectedShift] = useState("mañana")
  const { payments, refreshPayments } = usePayments(selectedDate, selectedShift)

  const { open: cashOpen, initialAmount, error: cashError, cerrada, existe, openCash, closeCash, setInitialAmount } = useCashRegister({ selectedShift, payments, userName: user?.nombre, })
  const { dialogs, selection, openDialog, closeDialog, onEditMember, onDeleteMember, onDeletePayment, onShowAddPayment } = useDialogManager(cashOpen)

  const handleMemberUpdated = (dni: string, nuevaFecha: string, nuevoPlan: string, clasesPagadas: number) => {
    setMembers(prev =>
      prev.map(m =>
        m.DNI === dni
          ? { ...m, Fecha_vencimiento: nuevaFecha, Plan: nuevoPlan, Clases_pagadas: clasesPagadas, Clases_realizadas: 0 }
          : m
      )
    );
  };
  const onMemberAdded = (newMember: Member) => {
    setMembers(prev => [...prev, newMember]);
    closeDialog("addMember");
  };
  const onMemberEdited = (edited: Member) => {
    setMembers(prev =>
      prev.map(m => m.DNI === edited.DNI ? edited : m)
    );
    closeDialog("editMember");
  };
  const onMemberDeleted = (dni: string) => {
    setMembers(prev =>
      prev.filter(m => m.DNI !== dni)
    );
    closeDialog("deleteMember");
  };

  useEffect(() => {
    if (!loading && (!user?.dni || !user?.rol)) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    const formattedMembers: Member[] = alumnos.map(alumno => ({
      id: alumno.ID,
      Nombre: alumno.Nombre,
      DNI: alumno.DNI,
      Email: alumno.Email,
      Telefono: alumno.Telefono,
      Clases_pagadas: Number(alumno.Clases_pagadas),
      Clases_realizadas: Number(alumno.Clases_realizadas),
      Fecha_inicio: alumno.Fecha_inicio,
      Fecha_vencimiento: alumno.Fecha_vencimiento,
      Fecha_nacimiento: alumno.Fecha_nacimiento,
      Plan: alumno.Plan,
      Profesor_asignado: alumno.Profesor_asignado,
    }));

    setMembers(formattedMembers);
  }, [alumnos]);

  useEffect(() => {
    refreshPayments()
  }, [selectedDate, selectedShift])

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader role="Recepcionista" />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {!cashOpen && cerrada && existe && (
          <div className="text-center text-xl font-bold text-gray-600">
            La caja del turno {selectedShift} ya está cerrada, cambia de turno en pagos para abrir una nueva caja.
          </div>
        )}

        {(!cerrada || !existe) && (
          <CashRegisterSection
            cashRegisterOpen={cashOpen}
            initialAmount={initialAmount}
            selectedShift={selectedShift}
            currentShiftPayments={payments}
            onOpenCashRegister={openCash}
            onCloseCashRegister={closeCash}
            setInitialAmount={setInitialAmount}
            errorMessage={cashError}
          />
        )}

        <Tabs defaultValue="members" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6 md:w-auto">
            <TabsTrigger value="members">Miembros</TabsTrigger>
            <TabsTrigger value="shift-payments">Pagos por Turno</TabsTrigger>
            <TabsTrigger value="assists">Asistencias</TabsTrigger>
            <TabsTrigger value="plans">Planes</TabsTrigger>
            <TabsTrigger value="shifts">Turnos</TabsTrigger>
            <TabsTrigger value="egresos">Egresos</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <MembersSection
              members={members}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onAddMember={() => openDialog("addMember")}
              onEdit={onEditMember}
              onDelete={onDeleteMember}
            />
          </TabsContent>

          <TabsContent value="shift-payments" className="space-y-4">
            <PaymentsSection
              currentShiftPayments={payments}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedShift={selectedShift}
              setSelectedShift={setSelectedShift}
              onShowAddPayment={onShowAddPayment}
              formatDate={formatDate}
              setSelectedPaymentToDelete={onDeletePayment}
              setShowDeletePaymentDialog={() => { }}
              onMemberUpdated={handleMemberUpdated}
              refreshPayments={refreshPayments}
              cashOpen={cashOpen}
            />
          </TabsContent>

          <TabsContent value="assists" className="space-y-4">
            <AssistsSection />
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            <PlansSection />
          </TabsContent>

          <TabsContent value="shifts" className="space-y-4">
            <ShiftsSection />
          </TabsContent>

          <TabsContent value="egresos" className="space-y-4">
            <EgresosSection />
          </TabsContent>
        </Tabs>
      </div>

      <AddMemberDialog
        open={dialogs.addMember}
        onOpenChange={() => closeDialog("addMember")}
        onMemberAdded={onMemberAdded}
      />

      <EditMemberDialog
        open={dialogs.editMember}
        onOpenChange={() => closeDialog("editMember")}
        member={selection.memberToEdit}
        onSave={(m: Member) => {
          updateAttendance(m.DNI, m.Clases_realizadas);
          onMemberEdited(m);
        }}
      />

      <DeleteMemberDialog
        open={dialogs.deleteMember}
        onOpenChange={() => closeDialog("deleteMember")}
        member={selection.memberToDelete!}
        onDelete={dni => {
          onMemberDeleted(dni);
        }}
      />

      <AddPaymentDialog
        open={dialogs.addPayment}
        onOpenChange={() => closeDialog("addPayment")}
        onPaymentAdded={refreshPayments}
        onMemberUpdated={handleMemberUpdated}
      />

      <DeletePaymentDialog
        open={dialogs.deletePayment}
        onOpenChange={() => closeDialog("deletePayment")}
        payment={selection.paymentToDelete!}
        onDelete={() => {
          refreshPayments()
          closeDialog("deletePayment")
        }}
      />
    </div>
  )
}
