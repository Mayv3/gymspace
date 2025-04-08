"use client"
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShiftPaymentsTab } from "@/components/dashboard/ShiftPaymentsTab"

type PaymentsSectionProps = {
  currentShiftPayments: any[]
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  selectedShift: string
  setSelectedShift: (value: string) => void
  onShowAddPayment: () => void
  formatDate: (date: Date) => string
  setSelectedPaymentToDelete: (value: any) => void
  setShowDeletePaymentDialog: (value: boolean) => void
  onMemberUpdated: (dni: string, nuevaFecha: string, nuevoPlan: string, clasesPagadas: number) => void
  refreshPayments: () => void
}

export default function PaymentsSection({
  currentShiftPayments,
  selectedDate,
  setSelectedDate,
  selectedShift,
  setSelectedShift,
  onShowAddPayment,
  formatDate,
  setSelectedPaymentToDelete,
  setShowDeletePaymentDialog,
  onMemberUpdated,
  refreshPayments
}: PaymentsSectionProps) {
  return (
    <TabsContent value="shift-payments" className="space-y-4">
      <ShiftPaymentsTab
        currentShiftPayments={currentShiftPayments}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedShift={selectedShift}
        setSelectedShift={setSelectedShift}
        setShowAddPayment={onShowAddPayment}
        formatDate={formatDate}
        setSelectedPaymentToDelete={setSelectedPaymentToDelete}
        setShowDeletePaymentDialog={setShowDeletePaymentDialog}
        onMemberUpdated={onMemberUpdated}
        refreshPayments={refreshPayments}
      />
    </TabsContent>
  )
}
