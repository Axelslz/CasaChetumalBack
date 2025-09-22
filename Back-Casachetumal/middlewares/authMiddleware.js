import jwt from 'jsonwebtoken';
import 'dotenv/config';

export const authRequired = (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        return res.status(401).json({ message: "No hay token, autorización denegada." });
    }

    jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Token inválido." });
        }
        
        req.user = decoded; 
        
        next();
    });
};