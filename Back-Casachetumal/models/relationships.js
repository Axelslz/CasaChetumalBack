import Reservation from './Reservation.js';
import Package from './Package.js';
import Snack from './Snack.js';
import Music from './Music.js';

export const setupAssociations = () => {
  // Una Reservación pertenece a un Paquete
  Package.hasMany(Reservation, { foreignKey: 'packageId' });
  Reservation.belongsTo(Package, { foreignKey: 'packageId' });

  // Una Reservación pertenece a una opción de Música
  Music.hasMany(Reservation, { foreignKey: 'musicId' });
  Reservation.belongsTo(Music, { foreignKey: 'musicId' });

  // Una Reservación puede tener MUCHAS Botanas y una Botana en MUCHAS Reservaciones
  Reservation.belongsToMany(Snack, { through: 'ReservationSnacks' });
  Snack.belongsToMany(Reservation, { through: 'ReservationSnacks' });

  console.log("Relaciones de la base de datos configuradas.");
};