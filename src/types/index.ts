export interface JwtPayload {
  id: string
  username: string
  role: 'admin' | 'vendor'
  // outros campos se necessário
}

declare global {
   namespace Express {
     interface Request {
      user: JwtPayload | null | undefined
     }
   }
 }