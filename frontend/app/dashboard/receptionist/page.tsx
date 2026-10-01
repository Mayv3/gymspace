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
  const { refreshMembers } = useAppData()
  const [searchTerm, setSearchTerm] = useState("")

  const today = new Date()
  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedShift, setSelectedShift] = useState("todos")
  const [selectedDay, setSelectedDay] = useState<number | undefined>()
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear())

  const [selectedSection, setSelectedSection] = useState("members")

  const { payments, summary, pagination, refreshPayments } = usePayments();

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
  } = useCashRegister({ selectedShift, summary, userName: user?.nombre })

  const { dialogs, selection, openDialog, closeDialog, onEditMember, onDeleteMember, onDeletePayment, onShowAddPayment } = useDialogManager(cashOpen)

  // La lista de socios está paginada en el servidor: ante cualquier cambio se vuelve a pedir la página
  const handleMemberUpdated = (
    _dni: string,
    _nuevaFecha: string,
    _nuevoPlan: string,
    _clasesPagadas: number
  ) => {
    refreshMembers()
  }

  const onMemberAdded = (_newMember: Member) => {
    refreshMembers()
    closeDialog("addMember")
  }

  const onMemberEdited = (_edited: Member) => {
    refreshMembers()
    closeDialog("editMember")
  }

  const onMemberDeleted = (_dni: string) => {
    refreshMembers()
    closeDialog("deleteMember")
  }

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
          <h2 className="text-3xl font-bold tracking-tight gradient-text">GYMSPACE - Panel de recepcionista</h2>
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
            totalPayments={summary.total}
            onOpenCashRegister={openCash}
            onCloseCashRegister={closeCash}
            setInitialAmount={setInitialAmount}
            errorMessage={cashError}
          />
        )}

        {selectedSection === "members" && (
          <MembersSection
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
            summary={summary}
            pagination={pagination}
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
