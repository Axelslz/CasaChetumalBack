import jwt from 'jsonwebtoken';
import 'dotenv/config';

export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(401).json({ message: "No hay token, autorización denegada." });
    }

    const token = authHeader.split(' ')[1]; 
    if (!token) {
        return res.status(401).json({ message: "Token en formato inválido." });
    }

    try {
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
        req.user = decoded; 
        
        next(); 
    } catch (error) {
        console.error("ERROR DE TOKEN:", error.message);
        res.status(401).json({ message: "Token no es válido." });
    }
};

