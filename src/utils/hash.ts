import { CONFIG } from '../config/config';
import * as bcrypt from 'bcrypt';

export async function hashPassword(password: string) {
  const salt = CONFIG.security.bcryptSaltOrRound;

  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}
