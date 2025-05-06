import venom from 'venom-bot'

async function enviarMensajeDePrueba() {
  try {
    const client = await venom.create({
      session: 'gymspace-session',
        headless: 'new',
    })

    const numero = '5493513274314@c.us'
    const mensaje = 'Hola Nico 👋 Este es un mensaje de prueba desde tu sistema de Gym 💪'

    await client.sendText(numero, mensaje)
    console.log('✅ Mensaje de prueba enviado correctamente.')

  } catch (error) {
    console.error('❌ Error al enviar mensaje de prueba:', error.message)
  }
}

enviarMensajeDePrueba()