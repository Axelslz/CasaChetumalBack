import Reservation from '../models/Reservation.js';
import Package from '../models/Package.js';
import Music from '../models/Music.js';
import Drink from '../models/Drink.js';
import Snack from '../models/Snack.js';
import { Op } from 'sequelize';

export const calculateTotal = async (req, res) => {
  const SALON_BASE_PRICE = 3000;
  try {
    const { packageId, addons, musicIds } = req.body;
    let total = SALON_BASE_PRICE;

    if (packageId) {
      const selectedPackage = await Package.findByPk(packageId);
      if (selectedPackage) {
        total += parseFloat(selectedPackage.price);
      }
    }

    if (musicIds && musicIds.length > 0) {
      const selectedMusic = await Music.findAll({ where: { id: musicIds } });
      selectedMusic.forEach(music => {
        total += parseFloat(music.price);
      });
    }

    if (addons && Object.keys(addons).length > 0) {
      const addonIds = Object.keys(addons);
      
      const snackPromise = Snack.findAll({ where: { id: addonIds } });
      const drinkPromise = Drink.findAll({ where: { id: addonIds } });

      const [foundSnacks, foundDrinks] = await Promise.all([snackPromise, drinkPromise]);

      const allFoundAddons = [...foundSnacks, ...foundDrinks];
      
      allFoundAddons.forEach(addon => {
        const quantity = addons[addon.id];
        if (quantity) {
          total += parseFloat(addon.price) * quantity;
        }
      });
    }

    res.json({ total });
  } catch (error) {
    console.error("ERROR AL CALCULAR TOTAL:", error);
    res.status(500).json({ message: "Error en el servidor al calcular el total.", error: error.message });
  }
};


export const createReservation = async (req, res) => {
  console.log('--- INICIO DE DEPURACIÓN: createReservation ---');
  console.log('CAMPOS DE TEXTO RECIBIDOS (req.body):', req.body);
  console.log('ARCHIVO RECIBIDO (req.file):', req.file);
  console.log('--- FIN DE DEPURACIÓN ---');

  if (!req.body || Object.keys(req.body).length === 0) {
    console.error('Error Crítico: req.body está vacío. El middleware multer no procesó los campos del formulario.');
    return res.status(400).json({ message: "Error del servidor: No se recibieron datos del formulario." });
  }

  try {
    const {
      clientName, clientPhone, eventDate, eventTime,
      packageId, musicIds, snackIds, totalPrice,
      paymentMethod, musicSchedule, musicNotes
    } = req.body;

    if (!clientName || !clientPhone || !eventDate) {
        console.error('Error: Faltan campos esenciales en req.body, aunque el objeto no está vacío.');
        return res.status(400).json({ message: "Faltan datos requeridos como nombre, teléfono o fecha." });
    }

    const today = new Date();
    const eventDateObj = new Date(eventDate);
    today.setHours(0, 0, 0, 0);
    eventDateObj.setUTCHours(0, 0, 0, 0);
    const daysDifference = (eventDateObj - today) / (1000 * 60 * 60 * 24);
    if (daysDifference <= 8 && paymentMethod === 'cash') {
      return res.status(400).json({
        message: "Para eventos con menos de 8 días de anticipación, el pago solo puede ser por transferencia."
      });
    }
    let paymentDeadline = null;
    if (paymentMethod === 'cash') {
      const deadlineDate = new Date(eventDate);
      deadlineDate.setDate(deadlineDate.getDate() - 7);
      paymentDeadline = deadlineDate.toISOString().split('T')[0];
    }

    const reservationData = {
      clientName, clientPhone, eventDate, eventTime, totalPrice,
      packageId,
      paymentMethod,
      paymentDeadline,
    };

    if (req.file) {
      reservationData.idPhotoUrl = req.file.path;
    }

    const newReservation = await Reservation.create(reservationData);

    const finalSnackIds = Array.isArray(snackIds) ? snackIds : (snackIds ? [snackIds] : []);
    const finalMusicIds = Array.isArray(musicIds) ? musicIds : (musicIds ? [musicIds] : []);

    if (finalSnackIds.length > 0) {
      await newReservation.addSnacks(finalSnackIds);
    }

    if (finalMusicIds.length > 0) {
      await newReservation.addMusic(finalMusicIds);
    }

    res.status(201).json(newReservation);
  } catch (error) {
    console.error("ERROR AL CREAR RESERVACIÓN (después de la validación):", error);
    res.status(500).json({ message: "Error al guardar la reservación en la base de datos.", error: error.message });
  }
};


export const getReservations = async (req, res) => {
  try {
    const { status, search } = req.query; 
    
    const whereClause = {};
    if (status && status !== 'all') {
      whereClause.status = status; 
    }
    if (search) {
      whereClause.clientName = { [Op.like]: `%${search}%` };
    }

    const reservations = await Reservation.findAll({
      where: whereClause, 
      include: [
        { model: Package, attributes: ['name'] },
      ],
      order: [['eventDate', 'DESC']]
    });

    const formattedReservations = reservations.map(r => ({
      id: r.id,
      cliente: r.clientName, 
      fecha: r.eventDate,   
      paquete: r.Package ? r.Package.name : 'No Asignado', 
      estado: r.status,
      status: r.status       
    }));
    res.json(formattedReservations);

  } catch (error) {
    console.error("Error al obtener reservaciones:", error); 
    res.status(500).json({ message: "Error al obtener las reservaciones." });
  }
};

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

export const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 

    const reservation = await Reservation.findByPk(id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservación no encontrada." });
    }

    reservation.status = status;

    if (status === 'paid') {
      reservation.paymentStatus = 'paid';
    }
    
    await reservation.save();
    
    res.json(reservation);
  } catch (error) {
    console.error("Error al actualizar el estado de la reservación:", error);
    res.status(500).json({ message: "Error al actualizar la reservación." });
  }
};

export const confirmPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findByPk(id);

    if (!reservation) {
      return res.status(404).json({ message: "Reservación no encontrada." });
    }

    reservation.paymentStatus = 'paid';
    reservation.status = 'confirmed';
    
    await reservation.save();
    
    res.json({ message: "Pago confirmado exitosamente.", reservation });
  } catch (error) {
    res.status(500).json({ message: "Error al confirmar el pago.", error: error.message });
  }
};

export const getOccupiedDates = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reservations = await Reservation.findAll({
      where: {
        status: { [Op.ne]: 'cancelled' }, 
        eventDate: { [Op.gte]: today }
      },
      attributes: ['eventDate', 'status', 'paymentStatus'] 
    });

    const datesWithStatus = reservations.map(r => {
      const displayStatus = r.paymentStatus === 'paid' ? 'confirmed' : 'pending';
      
      return {
        date: r.eventDate,
        status: displayStatus 
      };
    });
    
    res.json(datesWithStatus);

  } catch (error) {
    console.error("Error al obtener fechas ocupadas:", error);
    res.status(500).json({ message: "Error al obtener las fechas." });
  }
};