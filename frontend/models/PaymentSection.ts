import { PaymentsFilters } from "@/hooks/usePayments"
import { Payment } from "./dashboard"

export interface PaymentsSectionProps {
    currentShiftPayments: Payment[]
    selectedDate?: Date
    setSelectedDate?: (date: Date) => void
    selectedShift: string
    setSelectedShift: (shift: string) => void
    onShowAddPayment: () => void
    setSelectedPaymentToDelete: (payment: Payment) => void
    setShowDeletePaymentDialog: (show: boolean) => void
    onMemberUpdated: (dni: string, nuevaFecha: string, nuevoPlan: string, clasesPagadas: number) => void
    refreshPayments: (filters: PaymentsFilters) => Promise<void>
    cashOpen: boolean
    selectedDay: number | undefined
    setSelectedDay: (day: number | undefined) => void
    selectedMonth: number
    setSelectedMonth: (month: number) => void
    selectedYear: number
    setSelectedYear: (year: number) => void
}