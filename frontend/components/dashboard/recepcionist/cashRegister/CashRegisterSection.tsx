"use client"
import { Button } from "@/components/ui/button"
import { DollarSign } from "lucide-react"
import { CashRegisterCard } from "@/components/dashboard/recepcionist/cashRegister/CashRegisterCard"
import { useState, useRef, useCallback } from "react"

const HOLD_DURATION = 1250

function HoldButton({
  onConfirm,
  disabled,
  variant,
  label,
  loadingLabel,
}: {
  onConfirm: () => Promise<void>
  disabled?: boolean
  variant: "orange" | "destructive"
  label: string
  loadingLabel: string
}) {
  const [progress, setProgress] = useState(0)
  const [executing, setExecuting] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const triggeredRef = useRef(false)

  const startHold = useCallback(() => {
    if (disabled || executing) return
    triggeredRef.current = false
    startTimeRef.current = Date.now()
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - (startTimeRef.current ?? Date.now())
      const pct = Math.min((elapsed / HOLD_DURATION) * 100, 100)
      setProgress(pct)
      if (pct >= 100 && !triggeredRef.current) {
        triggeredRef.current = true
        clearInterval(intervalRef.current!)
        setExecuting(true)
        onConfirm().finally(() => {
          setExecuting(false)
          setProgress(0)
        })
      }
    }, 16)
  }, [disabled, executing, onConfirm])

  const cancelHold = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (!triggeredRef.current) setProgress(0)
  }, [])

  const radius = 10
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (progress / 100) * circumference

  const isOrange = variant === "orange"
  const trackColor = isOrange ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.25)"
  const progressColor = "white"

  return (
    <Button
      variant={variant}
      disabled={disabled || executing}
      className={isOrange ? "animate-pulse-scale select-none" : "select-none"}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      onClick={(e) => e.preventDefault()}
    >
      <span className="relative flex items-center gap-2">
        {(progress > 0 || executing) ? (
          <svg width="24" height="24" viewBox="0 0 24 24" className="-ml-1">
            <circle
              cx="12" cy="12" r={radius}
              fill="none"
              stroke={trackColor}
              strokeWidth="3"
            />
            <circle
              cx="12" cy="12" r={radius}
              fill="none"
              stroke={progressColor}
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={executing ? 0 : dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 12 12)"
              style={{ transition: "stroke-dashoffset 16ms linear" }}
            />
          </svg>
        ) : (
          <DollarSign className="h-4 w-4" />
        )}
        {executing ? loadingLabel : label}
      </span>
    </Button>
  )
}

type CashRegisterSectionProps = {
  cashRegisterOpen: boolean
  initialAmount: string
  selectedShift: string
  currentShiftPayments: any[]
  onOpenCashRegister: () => void
  onCloseCashRegister: () => void
  setInitialAmount: (value: string) => void
  errorMessage?: string | null
}

export default function CashRegisterSection({
  cashRegisterOpen,
  initialAmount,
  selectedShift,
  currentShiftPayments,
  onOpenCashRegister,
  onCloseCashRegister,
  setInitialAmount,
  errorMessage
}: CashRegisterSectionProps) {

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-x-2">
        <h1 className="text-xl font-bold text-transparent sm:text-2xl">
          .
        </h1>
        {errorMessage && (
          <div className="text-sm text-red-600 font-medium mt-2">
            {errorMessage}
          </div>
        )}
        {!cashRegisterOpen ? (
          <HoldButton
            variant="orange"
            label="Abrir Caja"
            loadingLabel="Abriendo..."
            disabled={selectedShift === "todos"}
            onConfirm={async () => { await onOpenCashRegister() }}
          />
        ) : (
          <HoldButton
            variant="destructive"
            label="Cerrar Caja"
            loadingLabel="Cerrando..."
            onConfirm={async () => { await onCloseCashRegister() }}
          />
        )}
      </div>

      {selectedShift === "todos" && (
        <div className="flex justify-center">
          <p className="text-lg text-red-600">
            Por favor selecciona un turno (mañana o tarde) para abrir la caja en PAGOS.
          </p>
        </div>
      )}

      {cashRegisterOpen && (
        <>
          <CashRegisterCard
            selectedShift={selectedShift}
            initialAmount={initialAmount}
            setInitialAmount={setInitialAmount}
            currentShiftPayments={currentShiftPayments}
          />
        </>
      )}

    </div>
  )
}
