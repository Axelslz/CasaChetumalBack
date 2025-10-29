import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Snack = sequelize.define('Snack', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ingredients: {
    type: DataTypes.STRING,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true, 
  },
  image: {
    type: DataTypes.TEXT, // DataTypes.STRING(1024)
    allowNull: true,
    defaultValue: 'https://res.cloudinary.com/dqozuofy6/image/upload/v1761162055/logo_logo_pdn5fh.png'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
}, { timestamps: true});

export default Snack;