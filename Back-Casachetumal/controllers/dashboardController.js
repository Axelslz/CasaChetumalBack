import { Sequelize, Op } from 'sequelize';
import Reservation from '../models/Reservation.js';
import Package from '../models/Package.js';

export const getPaymentMethodSummary = async (req, res) => {
  try {
    const paymentSummary = await Reservation.findAll({
      attributes: [
        'paymentMethod',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: {
        status: 'confirmed'
      },
      group: ['paymentMethod'],
      raw: true
    });

    const formattedSummary = paymentSummary.map(item => ({
      method: item.paymentMethod.charAt(0).toUpperCase() + item.paymentMethod.slice(1),
      count: item.count
    }));

    res.json(formattedSummary);

  } catch (error) {
    res.status(500).json({ message: "Error al obtener el resumen de métodos de pago.", error: error.message });
  }
};


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

export const getAllPaidReservations = async (req, res) => {
  try {
    const paidReservations = await Reservation.findAll({
      where: {
        status: 'confirmed' 
      },
      attributes: [ 
        'id',
        'clientName', 
        'eventDate',
        'paymentMethod',
        'totalPrice' 
      ],
      order: [['eventDate', 'DESC']]
    });

    const formattedReservations = paidReservations.map(res => ({
      id: res.id,
      cliente: res.clientName, 
      fecha: new Date(res.eventDate).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }), 
      metodo: res.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia', 
      monto: res.totalPrice 
    }));

    res.json(formattedReservations);

  } catch (error) {
    console.error("Error en getAllPaidReservations:", error); 
    res.status(500).json({ message: "Error al obtener los pagos de las reservaciones.", error: error.message });
  }
};

export const getFullDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfLast6Months = new Date(today.getFullYear(), today.getMonth() - 5, 1);

    const totalIncome = await Reservation.sum('totalPrice', { where: { status: 'paid' } });
    const activeReservations = await Reservation.count({ where: { status: 'confirmed' } });
    const upcomingEvents = await Reservation.count({ where: { eventDate: { [Op.gte]: today } } });
    const newClientsThisMonth = await Reservation.count({
      distinct: true,
      col: 'clientName',
      where: { createdAt: { [Op.gte]: firstDayOfCurrentMonth } },
    });
    
    const reservationsByMonthRaw = await Reservation.findAll({
      where: { eventDate: { [Op.gte]: firstDayOfLast6Months } },
      attributes: [
        [Sequelize.fn('YEAR', Sequelize.col('eventDate')), 'year'],
        [Sequelize.fn('MONTH', Sequelize.col('eventDate')), 'month'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'reservas'],
      ],
      group: ['year', 'month'],
      order: [['year', 'ASC'], ['month', 'ASC']],
      raw: true,
    });
    
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const reservationsByMonth = reservationsByMonthRaw.map(item => ({
      mes: `${monthNames[item.month - 1]}`,
      reservas: item.reservas,
    }));

    const SALON_BASE_PRICE = 3000;
    const totalIncomeFromPackages = await Reservation.sum('totalPrice', { where: { status: 'paid' } });
    const totalPaidReservations = await Reservation.count({ where: { status: 'paid' } });
    const incomeFromSalon = totalPaidReservations * SALON_BASE_PRICE;
    const incomeFromExtras = totalIncomeFromPackages - incomeFromSalon;

    const incomeDistribution = [
      { name: 'Ingreso Salón', value: incomeFromSalon > 0 ? incomeFromSalon : 0 },
      { name: 'Ingreso Extras', value: incomeFromExtras > 0 ? incomeFromExtras : 0 },
    ];
 
    const frequentClients = await Reservation.findAll({
      where: { status: 'paid' },
      attributes: [
        'clientName',
        [Sequelize.fn('SUM', Sequelize.col('totalPrice')), 'totalSpent'],
      ],
      group: ['clientName'],
      order: [[Sequelize.literal('totalSpent'), 'DESC']],
      limit: 5,
      raw: true,
    });

    res.json({
      kpi: {
        totalIncome: totalIncome || 0,
        activeReservations: activeReservations || 0,
        upcomingEvents: upcomingEvents || 0,
        newClientsThisMonth: newClientsThisMonth || 0,
        incomeFromExtras: incomeFromExtras > 0 ? incomeFromExtras : 0,
      },
      charts: {
        reservationsByMonth,
        incomeDistribution,
      },
      lists: {
        frequentClients,
      },
    });

  } catch (error) {
    console.error("Error al obtener las estadísticas del dashboard:", error);
    res.status(500).json({ message: "Error al obtener las estadísticas." });
  }
};