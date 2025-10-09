import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Music = sequelize.define('Music', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true, 
  },
  image: {
    type: DataTypes.BLOB('long'), 
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },  
}, { timestamps: true });

export default Music;