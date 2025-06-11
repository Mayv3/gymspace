import { useUser } from '@/context/UserContext'
import React, { useState } from 'react'

export const DeudasSection = () => {
    const [deudas, setDeudas] = useState([])
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [isSubmitting, setisSubmitting] = useState(false);
    const { user } = useUser()

    return (
        <div><p>Panel de deudas</p></div>
    )
}
