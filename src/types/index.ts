export type User = {
   id: string;
   username: string;
   password: string;
   fullName: string;
   role: 'admin' | 'vendor';
}

declare global {
   namespace Express {
     interface Request {
      user: User | null | undefined
     }
   }
 }