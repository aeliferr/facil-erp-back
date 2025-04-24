import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { JwtPayload } from '../types'

export default function verifyToken(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies.token

  if (!token) {
    res.status(401).json({ error: 'Token não encontrado' })
    return
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    req.user = decoded as JwtPayload
    next()
  } catch (err) {
    res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}