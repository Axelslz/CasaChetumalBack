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
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
}, { timestamps: true});

export default Snack;