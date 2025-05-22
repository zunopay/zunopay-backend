import {
  CopyObjectCommand,
  CopyObjectCommandInput,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { isEmpty } from 'lodash';
import config from '../../config/config';
import { appendTimestamp, Optional } from '../../utils/general';
import { s3File, UploadFileOptions } from './dto/types';
import { BadRequestException, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import * as path from 'path';

@Injectable()
export class S3Service {
  readonly region: string;
  readonly bucket: string;
  readonly cdn: string;
  readonly client: S3Client;

  constructor() {
    this.region = config().s3.region;
    this.bucket = config().s3.bucket;
    this.cdn = config().s3.cdn;
    const credentials = config().s3.credentials;

    this.client = new S3Client({ region: this.region, credentials });
  }

  async putObject(input: Optional<PutObjectCommandInput, 'Bucket'>) {
    return await this.client.send(
      new PutObjectCommand({ ...input, Bucket: this.bucket }),
    );
  }

  async getObject(input: Optional<GetObjectCommandInput, 'Bucket'>) {
    return await this.client.send(
      new GetObjectCommand({ ...input, Bucket: this.bucket }),
    );
  }

  async copyObject(input: Optional<CopyObjectCommandInput, 'Bucket'>) {
    return await this.client.send(
      new CopyObjectCommand({ Bucket: this.bucket, ...input }),
    );
  }

  getPublicUrl(key: string) {
    if (!key) return key;
    else if (key.startsWith('https://')) return key;
    else if (this.cdn) return `${config().s3.cdn}/${key}`;
    else return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }

  async getPresignedUrl(
    key: string,
    options?: Optional<GetObjectCommandInput, 'Bucket' | 'Key'>,
  ) {
    if (!key) return key;

    const getCommand = new GetObjectCommand({
      ...options,
      Bucket: this.bucket,
      Key: key,
    });

    const signedUrl = await getSignedUrl(this.client, getCommand, {
      expiresIn: 86400, // 24 hours
    });

    return signedUrl;
  }

  async deleteObject(key: string) {
    return await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  /** Clean up new files when updating existing ones, in case there was an old file and it was overwriten by any new file */
  async garbageCollectNewFiles(
    newFileKeys: string[],
    oldFileKeys: string[] = [],
  ) {
    for (const newFileKey of newFileKeys) {
      if (!!newFileKey && !oldFileKeys.includes(newFileKey)) {
        await this.deleteObject(newFileKey);
      }
    }
  }

  /** Clean up new file when updating an existing one, in case there was an old file and it was overwriten by the new file */
  async garbageCollectNewFile(newFileKey: string, oldFileKey?: string) {
    if (oldFileKey !== newFileKey) {
      await this.deleteObject(newFileKey);
    }
  }

  /** Clean up old file when uploading a new one, in case there was an old file and it wasn't overwriten by the new file */
  async garbageCollectOldFile(newFileKey: string, oldFileKey?: string) {
    if (oldFileKey && oldFileKey !== newFileKey) {
      await this.deleteObject(oldFileKey);
    }
  }

  /** Clean up old files when uploading new ones, in case there was an old file and it wasn't overwriten by the new file */
  async garbageCollectOldFiles(
    newFileKeys: string[],
    oldFileKeys: string[] = [],
  ) {
    for (const oldFileKey of oldFileKeys) {
      if (!!oldFileKey && !newFileKeys.includes(oldFileKey)) {
        await this.deleteObject(oldFileKey);
      }
    }
  }

  async deleteObjects(keys: string[]) {
    if (isEmpty(keys)) return;

    return await this.client.send(
      new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: { Objects: keys.map((Key) => ({ Key })) },
      }),
    );
  }

  async uploadFile(file: s3File, options: UploadFileOptions) {
    if (file) {
      const s3Folder = options.s3Folder;
      const fileName = options.fileName || uuid();
      const timestamp = options.timestamp ?? true;
      const finalFileName = timestamp ? appendTimestamp(fileName) : fileName;
      const fileKey =
        s3Folder + finalFileName + path.extname(file.originalname);

      await this.putObject({
        ContentType: file.mimetype,
        Key: fileKey,
        Body: file.buffer,
      });

      return fileKey;
    } else {
      const errorMessage = options.errorMessage || 'No file provided';
      throw new BadRequestException(errorMessage);
    }
  }
}
