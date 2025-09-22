import { Sequelize } from 'sequelize';
import Reservation from '../models/Reservation.js';
import Package from '../models/Package.js';

export const getDashboardStats = async (req, res) => {
  try {
    const totalReservations = await Reservation.count();
    const confirmedEvents = await Reservation.count({ where: { status: 'confirmed' } });

    const packageTypes = await Reservation.findAll({
      attributes: [
        [Sequelize.col('Package.name'), 'packageName'], 
        [Sequelize.fn('COUNT', Sequelize.col('Reservation.id')), 'count']
      ],
      include: [{
        model: Package,
        attributes: [] 
      }],
      group: ['Package.name'],
      raw: true
    });

    const reservationStatuses = await Reservation.findAll({
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('status')), 'count']
      ],
      group: ['status']
    });

    res.json({
      totalReservations,
      confirmedEvents,
      packageTypes,
      reservationStatuses
    });

  } catch (error) {
    res.status(500).json({ message: "Error al obtener las estadísticas del dashboard.", error: error.message });
  }
};