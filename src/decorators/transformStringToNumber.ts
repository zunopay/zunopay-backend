import { Transform, TransformOptions } from 'class-transformer';

export const TransformStringToNumber = (options?: TransformOptions) => {
  return Transform(({ value }) => {
    return typeof value === 'string' ? parseInt(value, 10) : value;
  }, options);
};
