import { PaymentsSectionProps } from "@/models/PaymentSection"
import { ShiftPaymentsTab } from "./ShiftPaymentsTab"

export default function PaymentsSection({
  currentShiftPayments,
  summary,
  pagination,
  selectedDay,
  setSelectedDay,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  selectedShift,
  setSelectedShift,
  onShowAddPayment,
  setSelectedPaymentToDelete,
  setShowDeletePaymentDialog,
  onMemberUpdated,
  refreshPayments,
  cashOpen,
}: PaymentsSectionProps) {
  return (
    <ShiftPaymentsTab
      cashOpen={cashOpen}
      currentShiftPayments={currentShiftPayments}
      summary={summary}
      pagination={pagination}
      selectedDay={selectedDay}
      setSelectedDay={setSelectedDay}
      selectedMonth={selectedMonth}
      setSelectedMonth={setSelectedMonth}
      setSelectedYear={setSelectedYear}
      selectedYear={selectedYear}
      selectedShift={selectedShift}
      setSelectedShift={setSelectedShift}
      setShowAddPayment={onShowAddPayment}
      setSelectedPaymentToDelete={setSelectedPaymentToDelete}
      setShowDeletePaymentDialog={setShowDeletePaymentDialog}
      onMemberUpdated={onMemberUpdated}
      refreshPayments={refreshPayments}
    />
  )
}