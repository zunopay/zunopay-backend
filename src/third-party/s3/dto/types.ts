export type s3File = {
  fieldname: Express.Multer.File['fieldname'];
  originalname: Express.Multer.File['originalname'];
  mimetype: Express.Multer.File['mimetype'];
  buffer: Express.Multer.File['buffer'];
};

export type UploadFileOptions = {
  s3Folder: string;
  fileName?: string;
  timestamp?: boolean;
  errorMessage?: string;
};
