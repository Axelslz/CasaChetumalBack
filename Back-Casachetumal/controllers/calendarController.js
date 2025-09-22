import { Op } from 'sequelize';
import Reservation from '../models/Reservation.js';

export const getEventsForMonth = async (req, res) => {
  try {
    const { year, month } = req.query; 

    if (!year || !month) {
      return res.status(400).json({ message: "El año y el mes son requeridos." });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const events = await Reservation.findAll({
      where: {
        eventDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: ['id', 'clientName', 'eventDate', 'status'] 
    });

    res.json(events);

  } catch (error) {
    res.status(500).json({ message: "Error al obtener los eventos del calendario." });
  }
};