import crypto from 'crypto';
import { db } from '../db.js';
import { User } from '../../src/types/index.js';

export class AuthService {
  /**
   * Hashes plain text passwords securely with SHA-256 and salt.
   */
  static hashPassword(password: string): string {
    return crypto.createHash('sha256').update(`fotovenda_salt_2026_${password}`).digest('hex');
  }

  /**
   * Generates a simple opaque session token for authenticated users.
   */
  static createToken(user: User): string {
    const payload = `${user.id}:${user.role}:${Date.now()}`;
    const token = Buffer.from(payload).toString('base64');
    return token;
  }

  /**
   * Verifies opaque token and retrieves user.
   */
  static verifyToken(token: string): User | null {
    try {
      if (!token) return null;
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [userId] = decoded.split(':');
      if (!userId) return null;

      const user = db.getUserById(userId);
      return user || null;
    } catch {
      return null;
    }
  }
}
