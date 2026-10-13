import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DollarSign } from "lucide-react"
import { motion } from "framer-motion"
import { useUser } from "@/context/UserContext"
import { useEffect } from "react"

interface CashRegisterCardProps {
  selectedShift: string
  initialAmount: string
  setInitialAmount: (value: string) => void
  currentShiftPayments: { Monto: number }[]
}

export function CashRegisterCard({
  selectedShift,
  initialAmount,
  setInitialAmount,
  currentShiftPayments,
}: CashRegisterCardProps) {
  const parsedInitial = parseFloat(initialAmount)
  const initial = isNaN(parsedInitial) ? 0 : parsedInitial
  const total = currentShiftPayments.reduce((sum, payment) => sum + Number(payment.Monto || 0), 0)
  const balance = initial + total
  const { user } = useUser()

  useEffect(() => {
    const verificarCajaAbierta = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/caja/abierta/${selectedShift}`)
        const data = await res.json()

        if (data.abierta) {
          setInitialAmount(data.saldoInicial)
        } else {
          setInitialAmount("0")
        }
      } catch (error) {
        console.error("Error al verificar caja abierta:", error)
      }
    }

    verificarCajaAbierta()
  }, [selectedShift])

  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="mb-4 bg-card rounded-2xl border border-border/60 shadow-soft">
        <CardHeader className="bg-brand-50/60 dark:bg-card rounded-t-2xl border-b border-border/60">
          <CardTitle className="flex items-center font-bold">
            <span className="mr-2 w-10 h-10 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center dark:bg-brand-900/30">
              <DollarSign className="h-5 w-5" />
            </span>
            Caja Registradora
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground font-medium">
            Turno actual: {selectedShift.charAt(0).toUpperCase() + selectedShift.slice(1)} - Recepcionista: {user?.nombre}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="initialAmount" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Monto Inicial</Label>
              <Input
                id="initialAmount"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                type="number"
                min="0"
                className="rounded-xl border-input focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Recaudado</Label>
              <div className="h-10 px-3 py-2 rounded-xl border border-emerald-100 bg-emerald-50 text-sm font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900">
                ${total.toLocaleString("es-AR")}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Balance Final</Label>
              <div className="h-10 px-3 py-2 rounded-xl border border-brand-100 bg-brand-50 text-sm font-bold text-brand-700 dark:bg-brand-900/20 dark:text-brand-300 dark:border-brand-900">
                ${balance.toLocaleString("es-AR")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
