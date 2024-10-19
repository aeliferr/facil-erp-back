import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../types";

const SECRET_KEY = 'secret_key'

function verifyToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, SECRET_KEY, (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid or expired token' });
            }

            req.user = decoded as User;  // Attach decoded user info to the request
            return next();  // Proceed to next middleware or route
        });

        return
    } else {
        return res.status(401).json({ message: 'No token provided' });
    }
}

export default verifyToken