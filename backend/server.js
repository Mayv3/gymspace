import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';

import alumnosRoutes from './routes/alumnos.routes.js';
import pagosRoutes from './routes/pagos.routes.js';
import rolesRoutes from './routes/roles.routes.js';
import asistenciasRoutes from './routes/asistencias.routes.js';
import clasesDiariasRoutes from './routes/clasesDiarias.routes.js';
import cajaRoutes from './routes/caja.routes.js';
import planes from './routes/planes.routes.js';
import anotaciones from './routes/anotaciones.routes.js';
import clasesClubRoutes from './routes/clasesElClub.routes.js';
import turnosRoutes from './routes/turnos.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js'
import egresosRoutes from './routes/egresos.routes.js';
import deudaRoutes from "./routes/deudas.routes.js"
import puntosRoutes from "./routes/puntos.routes.js";
import { emailsRouter } from './routes/emails.routes.js'

import { getAlumnosFromSheet } from './services/googleSheets.js';

import { enviarRecordatoriosPorLotes } from './services/recordatorioEmail.js';
import transporter from './services/recordatorioEmail.js'; 

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/alumnos', alumnosRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/asistencias', asistenciasRoutes);
app.use('/api/clases-diarias', clasesDiariasRoutes);
app.use('/api/caja', cajaRoutes);
app.use('/api/planes', planes);
app.use('/api/anotaciones', anotaciones);
app.use('/api/clases-el-club', clasesClubRoutes)
app.use('/api/turnos', turnosRoutes);
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/egresos', egresosRoutes);
app.use('/api/deudas', deudaRoutes)
app.use("/api/puntos", puntosRoutes);
app.use('/api/emails', emailsRouter)

app.get('/ping', (req, res) => res.sendStatus(200));

app.post('/api/trigger-recordatorios', async (req, res) => {
  try {
    const alumnos = await getAlumnosFromSheet();
    await enviarRecordatoriosPorLotes(alumnos);
    return res.status(200).send('Envío ejecutado');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Error interno');
  }
});

app.get('/api/test-email', async (req, res) => {
  try {
    await transporter.sendMail({
      from: `"Gymspace" <${process.env.EMAIL_USER}>`,
      to: "nicopereyra855@gmail.com",
      subject: '🧪 Test de correo Gymspace',
      text: '¡Hola! Este es un email de prueba enviado por Gymspace para verificar SMTP.',
    });
    console.log('✅ Email de prueba enviado a', "nicopereyra855@gmail.com");
    return res.status(200).send('✅ Email de prueba enviado');
  } catch (err) {
    console.error('❌ Error al enviar email de prueba:', err);
    return res.status(500).send('❌ Error: ' + err.message);
  }
});

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.set('socketio', io);

io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado:', socket.id);
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
