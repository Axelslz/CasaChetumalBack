import Reservation from '../models/Reservation.js';
import Package from '../models/Package.js';
import Music from '../models/Music.js';
import Snack from '../models/Snack.js';
import { Op } from 'sequelize';

export const createReservation = async (req, res) => {
  try {
    const { 
      clientName, clientPhone, eventDate, eventTime, 
      packageId, musicId, snackIds, totalPrice,
      paymentMethod 
    } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: "La foto de la identificación es requerida." });
    }

    const newReservation = await Reservation.create({
      clientName, clientPhone, eventDate, eventTime, totalPrice,
      idPhotoPath: req.file.path,
      packageId,
      musicId,
      paymentMethod,
    });

    if (snackIds && snackIds.length > 0) {
      await newReservation.addSnacks(snackIds);
    }

    res.status(201).json(newReservation);
  } catch (error) {
    res.status(500).json({ message: "Error al crear la reservación.", error: error.message });
  }
};

// solo admin 
export const getReservations = async (req, res) => {
  try {
    const { status, search } = req.query; 
    
    const whereClause = {};

    if (status && status !== 'all') {
      whereClause.status = status; 
    }

    if (search) {
      whereClause.clientName = {
        [Op.like]: `%${search}%` 
      };
    }

    const reservations = await Reservation.findAll({
      where: whereClause, 
      include: [
        { model: Package, attributes: ['name', 'price'] },
        { model: Music, attributes: ['name', 'price'] },
        { model: Snack, attributes: ['name', 'price'], through: { attributes: [] } }
      ],
      order: [['eventDate', 'DESC']]
    });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las reservaciones." });
  }
};

// el "carrito"
export const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findByPk(id, {
      include: [
        { model: Package },
        { model: Music },
        { model: Snack, through: { attributes: [] } }
      ]
    });

    if (!reservation) return res.status(404).json({ message: "Reservación no encontrada." });
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener la reservación." });
  }
};

// el admin actualice un estado (ej. a "confirmed")
export const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 

    const reservation = await Reservation.findByPk(id);
    if (!reservation) return res.status(404).json({ message: "Reservación no encontrada." });

    reservation.status = status;
    await reservation.save();
    
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar la reservación." });
  }
};