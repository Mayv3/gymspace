"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

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
import { usePayments, PaymentsFilters } from "@/hooks/usePayments"
import { useCashRegister } from "@/hooks/useCashRegister"
import { useDialogManager } from "@/hooks/useDialogManager"
import { useAppData } from "@/context/AppDataContext"

import { Member } from "@/models/dashboard"
import EgresosSection from "@/components/dashboard/recepcionist/egresos/EgresosSection"
import DebtsSection from "@/components/dashboard/recepcionist/deudas/Deudas"
import { ElClub } from "@/components/dashboard/recepcionist/elclub/ElClub"
import EmailBroadcast from "@/components/dashboard/recepcionist/emailBroadcast/EmailBroadcast"
import SideBar from "@/components/ui/sidebar-custom"
import { recepcionistTabs } from "../../../const/tabs"
import CircularProgress from "@mui/material/CircularProgress"


export default function ReceptionistDashboard() {
  const { user, loading } = useUser()
  const router = useRouter()

  const { updateAttendance } = useMembers()
  const { alumnos, setAlumnos } = useAppData()
  const [members, setMembers] = useState<Member[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  const today = new Date()
  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedShift, setSelectedShift] = useState("todos")
  const [selectedDay, setSelectedDay] = useState<number | undefined>()
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear())

  const [selectedSection, setSelectedSection] = useState("members")

  const { payments, refreshPayments } = usePayments();

  const buildCurrentFilters = (): PaymentsFilters => {
    const dynamicToday = new Date()
    return {
      dia: cashOpen ? dynamicToday.getDate() : selectedDay,
      mes: selectedMonth,
      anio: selectedYear,
      turno: selectedShift,
    }
  }

  const {
    open: cashOpen,
    initialAmount,
    error: cashError,
    cerrada,
    existe,
    openCash,
    closeCash,
    setInitialAmount
  } = useCashRegister({ selectedShift, payments, userName: user?.nombre })

  const { dialogs, selection, openDialog, closeDialog, onEditMember, onDeleteMember, onDeletePayment, onShowAddPayment } = useDialogManager(cashOpen)

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
    setAlumnos(prev => [...prev, newMember])
    setMembers(prev => [...prev, newMember]);
    closeDialog("addMember")
  }

  const onMemberEdited = (edited: Member) => {
    setMembers(prev => prev.map(m => m.DNI === edited.DNI ? edited : m))
    closeDialog("editMember")
  }

  const onMemberDeleted = (dni: string) => {
    setMembers(prev => prev.filter(m => m.DNI !== dni))
    closeDialog("deleteMember")
  }

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
      GymCoins: alumno.GymCoins
    }))
    setMembers(formattedMembers)
  }, [alumnos])

  useEffect(() => {
    refreshPayments(buildCurrentFilters())
  }, [cashOpen])

  useEffect(() => {
    if (!loading && user?.rol !== "Recepcionista") {
      const t = setTimeout(() => router.replace("/login"), 2000)
      return () => clearTimeout(t)
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <CircularProgress />
      </div>
    )
  }

  if (!user || user.rol !== "Recepcionista") {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-red-600 text-center">
          No estás autorizado.<br />
          Redirigiendo al login…
        </span>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader role="Recepcionista" />

      <SideBar
        tabs={recepcionistTabs}
        onSelect={setSelectedSection}
      />

      <div className="flex-1 space-y-4 md:p-8 pt-6 mx-auto max-w-[95vw] md:ml-[80px] w-full mb-20 md:mb-0">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight gradient-text">GymSpace - Panel de recepcionista</h2>
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

        {selectedSection === "members" && (
          <MembersSection
            members={members}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onAddMember={() => openDialog("addMember")}
            onEdit={onEditMember}
            onDelete={onDeleteMember}
          />
        )}

        {selectedSection === "shift-payments" && (
          <PaymentsSection
            currentShiftPayments={payments}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedShift={selectedShift}
            setSelectedShift={setSelectedShift}
            onShowAddPayment={onShowAddPayment}
            setSelectedPaymentToDelete={onDeletePayment}
            setShowDeletePaymentDialog={() => { }}
            onMemberUpdated={handleMemberUpdated}
            refreshPayments={refreshPayments}
            cashOpen={cashOpen}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
          />
        )}

        {selectedSection === "assists" && (
          <AssistsSection />
        )}

        {selectedSection === "plans" && (
          <PlansSection />
        )}

        {selectedSection === "shifts" && (
          <ShiftsSection />
        )}

        {selectedSection === "egresos" && (
          <EgresosSection />
        )}

        {selectedSection === "deudas" && (
          <DebtsSection />
        )}

        {selectedSection === "elclub" && (
          <ElClub />
        )}

        {selectedSection === "difusion" && (
          <EmailBroadcast />
        )}
      </div>

      <AddMemberDialog
        open={dialogs.addMember}
        onOpenChange={() => closeDialog("addMember")}
        onMemberAdded={onMemberAdded} />

      <EditMemberDialog
        open={dialogs.editMember}
        onOpenChange={() => closeDialog("editMember")}
        member={selection.memberToEdit} onSave={(m: Member) => { updateAttendance(m.DNI, m.Clases_realizadas); onMemberEdited(m) }} />

      <DeleteMemberDialog
        open={dialogs.deleteMember}
        onOpenChange={() => closeDialog("deleteMember")}
        member={selection.memberToDelete!} onDelete={dni => { onMemberDeleted(dni) }} />

      <AddPaymentDialog
        open={dialogs.addPayment}
        onOpenChange={() => closeDialog("addPayment")}
        onPaymentAdded={() => { refreshPayments(buildCurrentFilters()) }} onMemberUpdated={handleMemberUpdated} currentTurno={selectedShift} />

      <DeletePaymentDialog
        open={dialogs.deletePayment}
        onOpenChange={() => closeDialog("deletePayment")}
        payment={selection.paymentToDelete!}
        onDelete={() => {
          refreshPayments(buildCurrentFilters())
          closeDialog("deletePayment")
        }} />
    </div>
  )
}