import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import 'dotenv/config'; 

export const register = async (req, res) => {
    
    const { email, username, password } = req.body;
    try {
        
        const emailFound = await User.findOne({ where: { email } });
        if (emailFound) {
            return res.status(400).json({ message: "El correo electrónico ya está en uso." });
        }

        const newUser = await User.create({ email, username, password });

        res.json({
            id: newUser.id,
            email: newUser.email,
            username: newUser.username,
        });
    } catch (error) {
        console.error("ERROR EN REGISTRO:", error); 
        res.status(500).json({ message: "Error al registrar el usuario.", error: error.message });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const userFound = await User.findOne({ where: { email } });

        if (!userFound) {
            return res.status(400).json({ message: "Credenciales inválidas." }); 
        }

        const isMatch = await userFound.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Credenciales inválidas." }); 
        }

        const token = jwt.sign(
            { 
                id: userFound.id,
                role: userFound.role 
            }, 
            process.env.TOKEN_SECRET, 
            { expiresIn: '1d' } 
        );

        res.json({ 
            token, 
            user: { 
                id: userFound.id,
                email: userFound.email,
                username: userFound.username,
                role: userFound.role,
            }
        });

    } catch (error) {
        console.error("ERROR EN LOGIN:", error);
        res.status(500).json({ message: "Error en el inicio de sesión.", error: error.message });
    }
};

export const logout = (req, res) => {
    res.cookie('token', '', { 
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
     });
    return res.sendStatus(200); 
};

export const verifyToken = async (req, res) => {
    
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'email', 'username', 'role'] 
        });

        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        return res.json(user);

    } catch (error) {
        console.error("ERROR EN VERIFYTOKEN:", error);
        return res.status(500).json({ message: "Error al verificar el token.", error: error.message });
    }
};