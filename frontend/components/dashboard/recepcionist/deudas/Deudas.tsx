import { useUser } from '@/context/UserContext'
import React, { useState } from 'react'

export const DeudasSection = () => {
    const [deudas, setDeudas] = useState([])
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [isSubmitting, setisSubmitting] = useState(false);
    const { user } = useUser()

    return (
        <div>
            <h2 className='text-2xl'>Panel de deudas - Muy pronto</h2>
            <br />
            <i>Notas importantes para mis queridos secres:</i>
            <p>Cuando vayan a hacer un pago ahora las Nutri Consultas estan en TIPO DE PLAN = SERVICIOS y no modifican al alumno. Solamente les agrega las monedas.</p>
            <p>Tambien existe el TIPO DE PLAN = PRODUCTO que hace lo mismo. No modifica al alumno. Solamente le agrega las monedas que corresponden.</p>
            <br />
            <br />
            <p>Ya arregle las inscripciones del club, deberian funcionar bien "DEBERIAN".</p>
            <p>Los quiero mis secres</p>

            <br />
            <i className='text-red-500'>Atte: Nico su rubio fav ♡</i>

        </div>
    )
}
