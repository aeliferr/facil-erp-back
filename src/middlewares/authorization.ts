import jwt from 'jsonwebtoken'
import { User } from '../types'

export function auth(...authorizedRoles: string[]) {
    return (req, res, next) => {
      const token = req.cookies.token
      if (!token) return res.status(401).json({ error: 'Unauthorized' })

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as jwt.Secret)
        req.user = decoded as User

        if (authorizedRoles && !authorizedRoles.includes(req.user.role)) {
          return res.status(403).json({ error: 'Forbidden' })
        }

        next()
      } catch {
        return res.status(401).json({ error: 'Invalid token' })
      }
    }  
  }

