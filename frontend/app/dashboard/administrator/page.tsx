"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, TrendingUp } from "lucide-react"
import { formatDate } from "@/utils/dateUtils"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { MembersStatsTab } from "@/components/dashboard/administrator/MembersStatsTab"
import AdminOverviewCharts from "@/components/dashboard/administrator/AdminOverviewCharts"

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


export default function AdministratorDashboard() {
  const { user, loading } = useUser()

  const [showAddMember, setShowAddMember] = useState(false)
  const [tabValue, setTabValue] = useState("overview")
  const router = useRouter()

  const { updateAttendance } = useMembers()
  const { alumnos, setAlumnos } = useAppData();
  const [members, setMembers] = useState<Member[]>([]);

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedShift, setSelectedShift] = useState("mañana")
  const { payments, refreshPayments } = usePayments(selectedDate, selectedShift)

  const { open: cashOpen, initialAmount, error: cashError, cerrada, existe, openCash, closeCash, setInitialAmount } = useCashRegister({ selectedShift, payments, userName: user?.nombre, })
  const { dialogs, selection, closeDialog, onDeletePayment, onShowAddPayment } = useDialogManager(cashOpen)

  const handleMemberUpdated = (
    dni: string,
    nuevaFecha: string,
    nuevoPlan: string,
    clasesPagadas: number
  ) => {
    setMembers(prev =>
      prev.map(m =>
        m.DNI === dni
          ? {
            ...m,
            Fecha_vencimiento: nuevaFecha,
            Plan: nuevoPlan,
            Clases_pagadas: clasesPagadas,
            Clases_realizadas: 0,
          }
          : m
      )
    )
    setAlumnos(prev =>
      prev.map(a =>
        a.DNI === dni
          ? {
            ...a,
            Fecha_vencimiento: nuevaFecha,
            Plan: nuevoPlan,
            Clases_pagadas: clasesPagadas.toString(),
            Clases_realizadas: "0",
          }
          : a
      )
    )
  }

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
      <DashboardHeader role="Administrador" />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight gradient-text">GymSpace - Panel de administrador</h2>
        </div>
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

        <Tabs value={tabValue} onValueChange={setTabValue} className="space-y-4">
          <TabsList className="grid w-full grid-cols-7 md:w-auto">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">
              <TrendingUp className="mr-2 h-4 w-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="members" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">
              <Users className="mr-2 h-4 w-4" />
              Miembros
            </TabsTrigger>
            <TabsTrigger value="shift-payments" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">Pagos por Turno</TabsTrigger>
            <TabsTrigger value="assists" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">Asistencias</TabsTrigger>
            <TabsTrigger value="plans" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">Planes</TabsTrigger>
            <TabsTrigger value="shifts" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">Turnos</TabsTrigger>
            <TabsTrigger value="egresos" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">Egresos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" forceMount>
            <AdminOverviewCharts isVisible={tabValue === "overview"} />
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <MembersStatsTab
              members={members}
              onMemberAdded={onMemberAdded}
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
        open={showAddMember}
        onOpenChange={setShowAddMember}
        onMemberAdded={(newMember) => {
        }}
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

