import { sha256 } from 'js-sha256';
import { CONFIG } from '../config/config';
import * as bcrypt from 'bcrypt';

//TODO: need strong improvements here.
export function generateCommitment(vpa: string) {
  const data = `#${vpa}#`;
  return sha256(data);
}

export function generateProtectedVpa(vpa: string) {
  const protectedVpa =
    vpa.length >= 5
      ? `${vpa.slice(0, 2)}${'*'.repeat(vpa.length - 5)}${vpa.slice(-3)}`
      : '*****';
  return protectedVpa;
}

export async function hashPassword(password: string) {
  const salt = CONFIG.security.bcryptSaltOrRound;

  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}
