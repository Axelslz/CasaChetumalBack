import Package from '../models/Package.js';
import Snack from '../models/Snack.js';
import Music from '../models/Music.js';

export const getOptions = async (req, res) => {
  try {
    const packages = await Package.findAll();
    const snacks = await Snack.findAll();
    const music = await Music.findAll();
    res.json({ packages, snacks, music });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las opciones." });
  }
};