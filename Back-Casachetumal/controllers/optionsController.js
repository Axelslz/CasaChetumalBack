import Package from '../models/Package.js';
import Snack from '../models/Snack.js';
import Music from '../models/Music.js';
import Drink from '../models/Drink.js';
import cloudinary from '../config/cloudinary.js';

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

export const getCarouselImages = async (req, res) => {
  try {
    const { resources } = await cloudinary.search
      .expression('folder=Carrusel')
      .sort_by('created_at', 'desc')
      .max_results(10)
      .execute();

    const carouselImages = resources.map(file => ({
      id: file.public_id,
      title: file.context?.alt || 'Salón de eventos',
      description: file.context?.caption || 'Una vista de nuestras instalaciones.',
      imageUrl: file.secure_url,
    }));

    res.status(200).json(carouselImages);
  } catch (error) {
    console.error('Error fetching images from Cloudinary:', error);
    res.status(500).json({ message: 'Error al obtener las imágenes del carrusel.' });
  }
};