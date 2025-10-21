import { Sequelize } from 'sequelize';
import 'dotenv/config';

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error("Por favor define la variable de entorno DATABASE_URL dentro de tu archivo .env");
}

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres', 
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false 
    }
  }
});

export default sequelize;