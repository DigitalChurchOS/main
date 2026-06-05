import { StorageProvider, UploadResult } from '../interfaces';

export class MockAwsS3Driver implements StorageProvider {
  private bucketName: string;
  private region: string;

  constructor(config: { bucketName: string; accessKeyId: string; secretAccessKey: string; region: string }) {
    this.bucketName = config.bucketName;
    this.region = config.region;

    if (!config.bucketName || !config.accessKeyId || !config.secretAccessKey || !config.region) {
      throw new Error('Invalid AWS S3 configuration parameters');
    }
  }

  async uploadFile(fileName: string, buffer: Buffer, mimeType: string): Promise<UploadResult> {
    const fileKey = `${Date.now()}-${fileName}`;
    console.log(`[MockAwsS3] Uploading file: ${fileName} (${buffer.length} bytes, type: ${mimeType}) to bucket ${this.bucketName}`);
    return {
      success: true,
      fileKey,
      fileUrl: `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileKey}`,
    };
  }

  async deleteFile(fileKey: string): Promise<void> {
    console.log(`[MockAwsS3] Deleting file key ${fileKey} from bucket ${this.bucketName}`);
  }
}
