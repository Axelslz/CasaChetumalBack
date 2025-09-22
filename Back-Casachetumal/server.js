import express from 'express';
import cookieParser from 'cookie-parser';
import sequelize from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import optionsRoutes from './routes/optionsRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';

import { setupAssociations } from './models/relationships.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

app.use('/api', authRoutes);
app.use('/api', reservationRoutes);
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
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
  }
};

main();