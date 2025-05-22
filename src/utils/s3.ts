import config from '../config/config';

export const getPublicUrl = (key: string) => {
  // If key is an empty string, return it
  if (!key) return key;
  else if (key.startsWith('https://')) return key;
  else if (config().s3.cdn) return `${config().s3.cdn}/${key}`;
  else return `https://${config().s3.bucket}.s3.amazonaws.com/${key}`;
};
