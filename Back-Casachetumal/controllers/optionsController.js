import Package from '../models/Package.js';
import Snack from '../models/Snack.js';
import Music from '../models/Music.js';
import Drink from '../models/Drink.js';

export const getOptions = async (req, res) => {
  try {
    const attributes = ['id', 'name', 'price', 'description', 'image'];

    const packages = await Package.findAll({ attributes });
    const snacks = await Snack.findAll({ attributes });
    const music = await Music.findAll({ attributes });
    const drinks = await Drink.findAll({ attributes });

    res.json({ packages, snacks, music, drinks });

  } catch (error) {
    console.error("Error al obtener las opciones:", error);
    res.status(500).json({ message: "Error al obtener las opciones." });
  }
};