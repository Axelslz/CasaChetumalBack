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

//import { Sequelize } from 'sequelize';
//import 'dotenv/config';

//const sequelize = new Sequelize(

 // process.env.DB_NAME || 'basecasachetumal',
 // process.env.DB_USER || 'root',
 // process.env.DB_PASSWORD || '',
 // {
 //   host: process.env.DB_HOST || 'localhost',
 //   dialect: 'mysql'
 // }
//);

//export default sequelize;