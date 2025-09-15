export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || "your-secret-key", // TODO: Ensure JWT_SECRET is set in production
  expiresIn: "7d",
  algorithm: "HS256"
};

export const PASSWORD_CONFIG = {
  saltRounds: 10,
  minLength: 8
};