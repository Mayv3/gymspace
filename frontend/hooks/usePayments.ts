import { useState, useCallback, useEffect } from "react"
import { Payment } from "@/models/dashboard"
import dayjs from "dayjs"

export function usePayments(selectedDate: Date, selectedShift: string) {
  const [payments, setPayments] = useState<Payment[]>([])

  const fetchPayments = useCallback(async () => {
    try {
      const dateStr = dayjs(selectedDate).format("DD-MM-YYYY")
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pagos/fecha/${dateStr}/${selectedShift}`
      )
      const data: Payment[] = await res.json()
      setPayments(data)
    } catch (err) {
      console.error("Error al cargar pagos por turno", err)
    }
  }, [selectedDate, selectedShift])


  return {
    payments,
    refreshPayments: fetchPayments,
    setPayments,
  }
}
