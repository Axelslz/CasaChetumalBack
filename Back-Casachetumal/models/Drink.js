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
    type: DataTypes.BLOB('long'), 
    allowNull: true,
  }
});
export default Drink;