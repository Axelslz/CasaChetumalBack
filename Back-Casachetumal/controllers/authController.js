import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import 'dotenv/config'; 

export const register = async (req, res) => {
    const { username, password } = req.body;
    try {
        const userFound = await User.findOne({ where: { username } });
        if (userFound) {
            return res.status(400).json({ message: "El nombre de usuario ya existe." });
        }

        const newUser = await User.create({ username, password });
        res.json({
            id: newUser.id,
            username: newUser.username,
        });
    } catch (error) {
        res.status(500).json({ message: "Error al registrar el usuario.", error: error.message });
    }
};

export const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const userFound = await User.findOne({ where: { username } });
        if (!userFound) {
            return res.status(400).json({ message: "Usuario no encontrado." });
        }

        const isMatch = await userFound.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Contraseña incorrecta." });
        }

        const token = jwt.sign(
            { id: userFound.id }, 
            process.env.TOKEN_SECRET, 
            { expiresIn: '1d' } 
        );

        res.cookie('token', token, {    
            httpOnly: true, 
            secure: false, 
            sameSite: 'lax',
        });

        res.json({ message: "Inicio de sesión exitoso." });

    } catch (error) {
        res.status(500).json({ message: "Error en el inicio de sesión.", error: error.message });
    }
};

export const logout = (req, res) => {
    res.cookie('token', '', { expires: new Date(0) });
    return res.sendStatus(200);
};