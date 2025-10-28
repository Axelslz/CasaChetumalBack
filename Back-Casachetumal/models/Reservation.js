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
  musicSchedule: {
    type: DataTypes.TEXT, 
    allowNull: true,
  },
  musicNotes: {
    type: DataTypes.TEXT, 
    allowNull: true,
  },
  packageSnackSelections: {
    type: DataTypes.JSON, 
    allowNull: true
  },
  packageDrinkSelections: {
    type: DataTypes.JSON, 
    allowNull: true
  },
  includedDisposableQuantities: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Guarda las cantidades: { "vasos": 20, "tenedores": 20, "cucharas": 20, "charolas": 20 }'
  },
  extraAddons: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Guarda extras de personalización: { "drink_5": 2, "disposable_1": 3 }'
  }
}, {
  timestamps: true,
});

export default Reservation;