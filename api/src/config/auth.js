/**
 * Returns the JWT signing/verification secret.
 * There is deliberately no fallback: signing with a hard-coded default would let
 * anyone forge tokens, and signing and verifying with different secrets breaks auth.
 */
export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set. Add it to api/.env (see api/.env.example).");
  }
  return secret;
}

export const JWT_CONFIG = {
  expiresIn: "7d",
  algorithm: "HS256"
};

export const PASSWORD_CONFIG = {
  saltRounds: 10,
  minLength: 8
};
