import Reservation from '../models/Reservation.js';
import Package from '../models/Package.js';
import Music from '../models/Music.js';
import Drink from '../models/Drink.js';
import Snack from '../models/Snack.js';
import Disposable from '../models/Disposable.js';
import { Op } from 'sequelize';

export const calculateTotal = async (req, res) => {
  const SALON_BASE_PRICE = 3250;
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
      const snackIds = [];
      const drinkIds = [];
      const disposableIds = [];

      for (const prefixedId in addons) {
        const [type, idStr] = prefixedId.split('_');
        const id = parseInt(idStr, 10);
        if (!isNaN(id)) {
          if (type === 'snack') snackIds.push(id);
          else if (type === 'drink') drinkIds.push(id);
          else if (type === 'disposable') disposableIds.push(id);
        }
      }

      const snackPromise = snackIds.length > 0 ? Snack.findAll({ where: { id: snackIds } }) : Promise.resolve([]);
      const drinkPromise = drinkIds.length > 0 ? Drink.findAll({ where: { id: drinkIds } }) : Promise.resolve([]);
      const disposablePromise = disposableIds.length > 0 ? Disposable.findAll({ where: { id: disposableIds } }) : Promise.resolve([]);

      const [foundSnacks, foundDrinks, foundDisposables] = await Promise.all([
        snackPromise,
        drinkPromise,
        disposablePromise
      ]);

      foundSnacks.forEach(item => {
        const quantity = addons[`snack_${item.id}`];
        if (quantity) total += parseFloat(item.price) * quantity;
      });
      foundDrinks.forEach(item => {
        const quantity = addons[`drink_${item.id}`];
        if (quantity) total += parseFloat(item.price) * quantity;
      });
      foundDisposables.forEach(item => {
        const quantity = addons[`disposable_${item.id}`];
        if (quantity) total += parseFloat(item.price) * quantity;
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
  console.log('ARCHIVOS RECIBIDOS (req.files):', req.files);
  console.log('--- FIN DE DEPURACIÓN ---');

  if (!req.body || typeof req.body !== 'object') { 
     console.error('Error Crítico: req.body no es un objeto válido.');
     return res.status(400).json({ message: "Error del servidor: Datos del formulario inválidos." });
  }

  try {
    const {
      clientName, clientPhone, eventDate, eventTime,
      packageId, musicIds, /* Quitamos snackIds */ totalPrice,
      paymentMethod: paymentMethodInput,
      musicSchedule: musicScheduleString, 
      musicNotes,
      packageSnackSelections: packageSnackSelectionsString, 
      packageDrinkSelections: packageDrinkSelectionsString, 
      includedDisposableQuantities: includedDisposableQuantitiesString, 
      cashPaymentDateTime,
      addons: addonsString 
    } = req.body;

    let addons = {}; 
    if (addonsString && typeof addonsString === 'string') {
        try {
            addons = JSON.parse(addonsString);
            console.log("Addons parseados:", addons); 
            if (typeof addons !== 'object' || addons === null) {
                console.warn("Addons no se parseó como objeto:", addons);
                addons = {}; 
            }
        } catch (e) {
            console.error("Error al parsear addons JSON recibido:", e, addonsString);
            addons = {}; 
        }
    } else if (addons && typeof addons === 'object') {
        console.warn("Addons llegó como objeto, no como string JSON.");
        addons = addons;
    }

    const finalPaymentMethod = Array.isArray(paymentMethodInput)
                               ? paymentMethodInput[0]
                               : paymentMethodInput;
    if (!finalPaymentMethod || (finalPaymentMethod !== 'cash' && finalPaymentMethod !== 'transfer')) {
        return res.status(400).json({ message: "Método de pago inválido." });
    }
    if (!clientName || !clientPhone || !eventDate) {
        return res.status(400).json({ message: "Faltan datos requeridos." });
    }

    let paymentDeadline = null;
    let paymentReceiptUrl = null;
    let finalCashPaymentDateTime = null;
    if (finalPaymentMethod === 'cash') {
      if (!cashPaymentDateTime) {
         const today = new Date();
         const eventDateObj = new Date(eventDate);
         today.setHours(0, 0, 0, 0);
         eventDateObj.setUTCHours(0, 0, 0, 0);
         const daysDifference = (eventDateObj - today) / (1000 * 60 * 60 * 24);
         if(daysDifference > 8) {
            const deadlineDate = new Date(eventDateObj);
            deadlineDate.setDate(deadlineDate.getDate() - 7);
            paymentDeadline = deadlineDate.toISOString().split('T')[0];
         }
      } else {
        finalCashPaymentDateTime = new Date(cashPaymentDateTime);
      }
    }
    let idPhotoUrl = null;
    if (req.files && req.files.idPhoto && req.files.idPhoto.length > 0) {
      idPhotoUrl = req.files.idPhoto[0].path;
    }
    if (req.files && req.files.receipt && req.files.receipt.length > 0) {
      paymentReceiptUrl = req.files.receipt[0].path;
    }

    const addonsToSave = {};
    const snackAddonIds = [];

    if (addons && typeof addons === 'object') {
        for (const prefixedId in addons) {
            const [type, idStr] = prefixedId.split('_');
            const id = parseInt(idStr, 10);
            const quantity = addons[prefixedId]; 

            if (!isNaN(id) && quantity > 0) {
                if (type === 'snack') {
                    snackAddonIds.push(id.toString());
                } else if (type === 'drink' || type === 'disposable') {
                    addonsToSave[prefixedId] = quantity; 
                }
            }
        }
    }
   
    const safeParseJsonField = (jsonString, fieldName) => {
        if (!jsonString || typeof jsonString !== 'string') return null;
        try {
            const parsed = JSON.parse(jsonString);
            return (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) ? parsed : null;
        } catch (e) {
            console.error(`Error al parsear ${fieldName} JSON:`, e, jsonString);
            return null; 
        }
    };


    const reservationData = {
      clientName, clientPhone, eventDate, eventTime, totalPrice,
      packageId: packageId || null,
      paymentMethod: finalPaymentMethod,
      paymentDeadline,
      paymentReceiptUrl,
      cashPaymentDateTime: finalCashPaymentDateTime,
      status: 'pending',
      paymentStatus: 'pending',
      musicSchedule: safeParseJsonField(musicScheduleString, 'musicSchedule'),
      musicNotes,
      packageSnackSelections: safeParseJsonField(packageSnackSelectionsString, 'packageSnackSelections'),
      packageDrinkSelections: safeParseJsonField(packageDrinkSelectionsString, 'packageDrinkSelections'),
      includedDisposableQuantities: safeParseJsonField(includedDisposableQuantitiesString, 'includedDisposableQuantities'),
      idPhotoUrl: idPhotoUrl,
      extraAddons: addonsToSave 
    };

    const newReservation = await Reservation.create(reservationData);

    if (snackAddonIds.length > 0) {
      await newReservation.addSnacks(snackAddonIds);
    }

    let finalMusicIds = [];
    if (musicIds) {
        if (Array.isArray(musicIds)) {
            finalMusicIds = musicIds.map(id => String(id));
        } else if (typeof musicIds === 'string') {
            finalMusicIds = [String(musicIds)];
        }
    }
    if (finalMusicIds.length > 0) {
      await newReservation.addMusic(finalMusicIds);
    }


    res.status(201).json(newReservation);
  } catch (error) {
    console.error("ERROR AL CREAR RESERVACIÓN:", error);
     if (error.name === 'SequelizeValidationError') {
       return res.status(400).json({ message: "Error de validación: " + error.errors.map(e => e.message).join(', ') });
     }
     if (error.name === 'SequelizeDatabaseError') {
       return res.status(500).json({ message: "Error de base de datos al guardar.", detail: error.parent?.sqlMessage || error.message });
     }
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
      status: r.status,
      monto: parseFloat(r.totalPrice), 
      metodo: r.paymentMethod === 'transfer' ? 'Transferencia' : 'Efectivo' 
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
        {
          model: Package, 
        },
        {
          model: Music, 
          through: { attributes: [] } 
        },
        {
           model: Snack, 
           through: { attributes: [] } 
        }
      ]
    });

    if (!reservation) {
      return res.status(404).json({ message: "Reservación no encontrada." });
    }

    res.json(reservation);

  } catch (error) {
    console.error("Error al obtener la reservación por ID:", error);
    if (error.name === 'SequelizeEagerLoadingError') {
         return res.status(500).json({ message: "Error interno: Problema al cargar datos relacionados.", detail: error.message });
     }
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