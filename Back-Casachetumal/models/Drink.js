import { DataTypes } from 'sequelize'; 
import sequelize from '../config/db.js'; 

const Drink = sequelize.define('Drink', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  image: {
    type: DataTypes.TEXT, //DataTypes.STRING(1024), 
    allowNull: true,
    defaultValue: 'https://res.cloudinary.com/dqozuofy6/image/upload/v1761162055/logo_logo_pdn5fh.png'
  }
});
export default Drink;