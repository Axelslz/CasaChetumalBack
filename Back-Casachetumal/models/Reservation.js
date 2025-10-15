import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Reservation = sequelize.define('Reservation', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  clientName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  clientPhone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  eventDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  eventTime: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },    
  paymentMethod: { 
    type: DataTypes.ENUM('cash', 'transfer'),
    allowNull: false,
  },
  paymentStatus: { 
    type: DataTypes.ENUM('pending', 'paid', 'refunded'),
    defaultValue: 'pending',
  },
  paymentDeadline: { 
    type: DataTypes.DATEONLY,
    allowNull: true, 
  },
 idPhotoUrl: { 
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'paid'), 
    defaultValue: 'pending',
  },
}, {
  timestamps: true,
});

export default Reservation;