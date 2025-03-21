import { Service } from 'typedi';
import {
  S3,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import envConf from '@/config/env.conf';

@Service()
export class FileStorageService {
  private readonly s3Client: S3; // Replace 'any' with the actual S3 type from AWS SDK
  private readonly bucketName: string = envConf.aws.s3BucketName; // Replace with your bucket name
  private readonly region: string = envConf.aws.s3Region; // Replace with your region
  constructor() {
    // Initialize AWS SDK and S3 client here
    this.s3Client = new S3({
      region: envConf.aws.s3Region,
      credentials: {
        accessKeyId: envConf.aws.s3AccessKeyId, // Replace
        secretAccessKey: envConf.aws.s3SecretAccessKey, // Replace
      },
    });
  }

  async uploadFile(fileContent: Buffer, filePath: string): Promise<string> {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
        Body: fileContent,
      })
    );
    return filePath;
  }

  async deleteFile(filePath: string): Promise<void> {
    // Implement S3 delete file logic here
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      })
    );
  }

  async getFile(bucketName: string, fileName: string) {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    });

    const response = await this.s3Client.send(command);

    return response.Body; // This will be a ReadableStream
  }
}
