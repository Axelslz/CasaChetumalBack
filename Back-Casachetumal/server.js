import express from 'express';
import cookieParser from 'cookie-parser';
import sequelize from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import cors from 'cors';
import reservationRoutes from './routes/reservationRoutes.js';
import optionsRoutes from './routes/optionsRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';

import { setupAssociations } from './models/relationships.js';
import { startWhatsappBot } from './services/whatsappService.js';

const app = express();
const PORT = process.env.PORT || 3000;

const whitelist = [
  'https://casachetumal.com',      
  'https://www.casachetumal.com', 
  'http://localhost:5173'         
];

const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true 
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  console.log(`Petición entrante: ${req.method} ${req.originalUrl}`);
  next();
});
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.status(200).send('API de Casa Chetumal está en línea y funcionando!');
});

app.use('/api', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api', optionsRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', calendarRoutes);

const main = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida.');

    setupAssociations();

    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados y tablas creadas.');

    startWhatsappBot();

    app.listen(PORT, () => {
      console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
  }
};

main();
