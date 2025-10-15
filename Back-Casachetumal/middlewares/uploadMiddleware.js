import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'identificaciones',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const originalName = file.originalname.split('.')[0].replace(/\s+/g, '_');
      return `id-${originalName}-${uniqueSuffix}`;
    },
  },
});

const upload = multer({ storage: storage });

export default upload;