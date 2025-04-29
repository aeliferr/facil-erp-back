import bcrypt from "bcrypt";

export async function hashToken(token: string) {
  return bcrypt.hash(token, 10);
}