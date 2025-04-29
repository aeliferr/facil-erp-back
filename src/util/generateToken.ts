import crypto from "crypto";

export default function generateToken() {
  return crypto.randomBytes(32).toString("hex"); // Gera token aleatório seguro
}