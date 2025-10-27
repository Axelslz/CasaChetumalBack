import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Package = sequelize.define('Package', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true, 
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING(1024), // DataTypes.TEXT, 
    allowNull: true,
    defaultValue: 'https://res.cloudinary.com/dqozuofy6/image/upload/v1761162055/logo_logo_pdn5fh.png'
  },
  numBotanas: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  numRefrescos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  minDesechables: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Cantidad mínima de desechables (ej. 10)'
  },
  maxDesechables: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Cantidad máxima de desechables (ej. 29 o 40)'
  }
}, { timestamps: true });

export default Package;