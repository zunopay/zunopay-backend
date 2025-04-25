import { buildMessage, ValidateBy, ValidationOptions } from 'class-validator';
import { isSolanaAddress } from '../utils/payments';

/**
 * Check if the string is a Solana address using PublicKey.isOnCurve method. Does not validate address checksums.
 * If given value is not a string, then it returns false.
 */

const IS_SOLANA_ADDRESS = 'IsSolanaAddress';
export function IsSolanaAddress(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: IS_SOLANA_ADDRESS,
      validator: {
        validate: (value): boolean => isSolanaAddress(value),
        defaultMessage: buildMessage(
          (eachPrefix) => eachPrefix + '$property must be a Solana address',
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}
