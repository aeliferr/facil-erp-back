import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { User } from '../types'

export function auth(requiredRole?: ['admin', 'vendor']) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token
    if (!token) return res.status(401).json({ error: 'Unauthorized' })

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as jwt.Secret)
      req.user = decoded as User

      if (requiredRole && requiredRole.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      next()
    } catch {
      return res.status(401).json({ error: 'Invalid token' })
    }
  }
}
