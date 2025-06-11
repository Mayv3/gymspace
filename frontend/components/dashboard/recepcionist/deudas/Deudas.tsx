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
            <br />
            <br />
            <p>Cuando vayan a hacer un pago ahora las Nutri Consultas estan en <b>TIPO DE PLAN =&gt; SERVICIOS</b> y <b>NO modifica al alumno</b>. Solamente les agrega las monedas.</p>
            <p>Tambien existe el <b> TIPO DE PLAN =&gt; PRODUCTO </b> que hace lo mismo. <b>NO modifica al alumno</b> . Solamente le agrega las monedas que corresponden.</p>
        <br />
            <i>
                Ejemplos
                <ol>
                    <li> 1- Alguien quiere una <b>Nutri Consulta</b>. Bueno, van a pagos. Seleccionan el tipo de plan <b>SERVICIO</b> y seleccionan <b>Nutri Consulta</b> y lo cobran comunmente. <b>Solo agregará las coins</b></li>
                    <li> 2- Alguien quiere pagar un <b>Café</b>. Bueno, van a pagos. Seleccionan el tipo de plan <b>PRODUCTO</b> y seleccionan <b>Café</b> y lo cobran comunmente. <b>Solo agregará las coins</b></li>
                </ol>
            </i>
            <br />
            <br />
            <p>Cuando quieran cobrar una <b>deuda</b> a alguien tienen que seleccionar de que lugar es la deuda  <b>`DEUDA GIMNASIO`</b> o <b>`DEUDA CLASES`</b>. Seleccionan el plan e ingresan el monto que debe el alumno. Esto <b>NO modifica al alumno y no le suma coins</b></p>
            <br />
            <p>Ya arregle las inscripciones del club, deberian funcionar bien "DEBERIAN".</p>
            <br />
            <br />
            <br />
            <br /><p>Los quiero mis secres</p>

            <br />
            <i className='text-red-500'>Atte: Nico su rubio fav ♡</i>

        </div>
    )
}
