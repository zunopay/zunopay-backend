import { BadRequestException } from '@nestjs/common';
import { isEmail, maxLength, minLength } from 'class-validator';
import {
  USERNAME_MAX_SIZE,
  USERNAME_MIN_SIZE,
  USERNAME_REGEX,
} from '../constants';

export function findUsernameError(name: string) {
  if (typeof name !== 'string') {
    return `Bad Username format: ${name || '<unknown>'}`;
  } else if (!maxLength(name, USERNAME_MAX_SIZE)) {
    return `Username can have max ${USERNAME_MAX_SIZE} characters`;
  } else if (!minLength(name, USERNAME_MIN_SIZE)) {
    return `Username must have atleast ${USERNAME_MIN_SIZE} characters`;
  } else if (!USERNAME_REGEX.test(name)) {
    return 'Username can only have A-Z, 0-9 and underscore characters';
  }
}

export function validateUserName(name: string) {
  const usernameError = findUsernameError(name);
  if (usernameError) throw new BadRequestException(usernameError);
  return true;
}

export function validateEmail(email: string) {
  if (typeof email !== 'string') {
    throw new BadRequestException(`Bad email format: ${email || '<unknown>'}`);
  } else if (!isEmail(email)) {
    throw new BadRequestException('Incorrect email format');
  }
}
