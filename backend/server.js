import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import alumnosRoutes from './routes/alumnos.routes.js';
import pagosRoutes from './routes/pagos.routes.js';
import rolesRoutes from './routes/roles.routes.js';
import asistenciasRoutes from './routes/asistencias.routes.js';
import clasesDiariasRoutes from './routes/clasesDiarias.routes.js';
import cajaRoutes from './routes/caja.routes.js';
import planes from './routes/planes.routes.js';
import anotaciones from './routes/anotaciones.routes.js';

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
