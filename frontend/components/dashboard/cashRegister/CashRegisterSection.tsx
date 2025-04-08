"use client"
import { Button } from "@/components/ui/button"
import { DollarSign } from "lucide-react"
import { CashRegisterCard } from "@/components/dashboard/cashRegister/CashRegisterCard"

type CashRegisterSectionProps = {
  cashRegisterOpen: boolean
  initialAmount: string
  selectedShift: string
  currentShiftPayments: any[]
  onOpenCashRegister: () => void
  onCloseCashRegister: () => void
  setInitialAmount: (value: string) => void
}

export default function CashRegisterSection({
  cashRegisterOpen,
  initialAmount,
  selectedShift,
  currentShiftPayments,
  onOpenCashRegister,
  onCloseCashRegister,
  setInitialAmount
}: CashRegisterSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-x-2">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            Panel de administracion
        </h1>
        {!cashRegisterOpen ? (
            
          <Button
            variant="orange"
            onClick={onOpenCashRegister}
            className="animate-pulse-scale"
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Abrir Caja
          </Button>
        ) : (
          <Button variant="destructive" onClick={onCloseCashRegister}>
            <DollarSign className="mr-2 h-4 w-4" />
            Cerrar Caja
          </Button>
        )}
      </div>
      {cashRegisterOpen && (
        <CashRegisterCard
          selectedShift={selectedShift}
          initialAmount={initialAmount}
          setInitialAmount={setInitialAmount}
          currentShiftPayments={currentShiftPayments}
        />
      )}
    </div>
  )
}
