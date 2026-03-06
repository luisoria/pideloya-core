import { createHash } from "crypto"

/**
 * Hash a password using SHA-256 with a salt.
 * For demo/development — in production use bcrypt or Argon2.
 */
export function hashPassword(password: string): string {
    const salt = "pideloya_salt_2026"
    return createHash("sha256").update(password + salt).digest("hex")
}

export function verifyPassword(password: string, hash: string): boolean {
    return hashPassword(password) === hash
}
