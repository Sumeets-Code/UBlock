import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET_KEY;

const generateToken = (userId) => {
    try {
        const token = jwt.sign({userId}, SECRET_KEY, {expiresIn: "48h"});
        return token;
    } catch (err) {
        console.error(`Token creation error: ${err.message}`)
    }
}

const getIdByToken = (token) => {
    if (!token) {
        console.error('No token provided');
        return null;
    }

    if (typeof token !== 'string') {
        console.error('Token must be a string');
        return null;
    }

    try {
        const cleanToken = token.startsWith('Bearer ')? token.slice(7) : token;

        if (cleanToken.split('.').length !== 3) {
            console.error('Malformed token structure');
            return null;
        }

        const decodedToken = jwt.verify(cleanToken, SECRET_KEY);
        
        if (!decodedToken.userId) {
            console.error('Token does not contain userId');
            return null;
        }

        return decodedToken.userId;
    } catch (err) {
        switch (err.name) {
            case 'TokenExpiredError':
                console.error('Token has expired');
                break;
            case 'JsonWebTokenError':
                console.error('Invalid token:', err.message);
                break;
            default:
                console.error('Unexpected error:', err.message);
        }
        return null;
    }
}

export default { generateToken, getIdByToken };