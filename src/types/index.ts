export interface JwtPayload {
  id: string
  username: string
  role: 'admin' | 'vendor'
  tenantId: string
  // outros campos se necessário
}

declare global {
   namespace Express {
     interface Request {
      user: JwtPayload
     }
   }
 }