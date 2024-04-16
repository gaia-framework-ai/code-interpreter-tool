import {
  BlobServiceClient,
  BlobSASPermissions,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters
} from "@azure/storage-blob";
import path from "path";
import { promises as fs } from 'fs';
import { config } from "../config";
import { BlobType } from "../utils/types";

/**
 * Represents a service for interacting with Azure Blob Storage.
 */
export class AzureBlobService {
  private blobServiceClient: BlobServiceClient;

  constructor() {
    this.blobServiceClient = BlobServiceClient.fromConnectionString(config.azureStorageConnectionString);
  }

  static isBlobStorageAvailable(): boolean {
    return Boolean(config.azureStorageConnectionString);
  }

  /**
   * Generates a Shared Access Signature (SAS) URL for a blob in Azure Blob Storage.
   * @param blobServiceClient - The BlobServiceClient instance.
   * @param containerName - The name of the container.
   * @param blobName - The name of the blob.
   * @returns A Promise that resolves to the SAS URL for the blob.
   */
  async generateBlobSasUrl(blobServiceClient: BlobServiceClient, containerName: string, blobName: string): Promise<string> {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);

    const sasOptions = {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse("r"),
      startsOn: new Date(),
      expiresOn: new Date(new Date().valueOf() + 3600 * 1000), // 1 hour from now
    };

    const sharedKeyCredential = new StorageSharedKeyCredential(
      config.azureStorageAccountName,
      config.azureStorageAccountKey
    );

    const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();

    return `${blobClient.url}?${sasToken}`;
  }

  /**
   * Uploads data to a blob container and returns a shared access signature (SAS) token for the uploaded blob.
   * @param data - The data to be uploaded as a string.
   * @param type - The type of the blob.
   * @param fileExtension - The file extension of the blob.
   * @returns A Promise that resolves to the SAS token for the uploaded blob.
   */
  async uploadToBlob(data: string, type: BlobType, fileExtension: string): Promise<string> {
    const blobContainerClient = this.blobServiceClient.getContainerClient(config.azureBlobContainerName);
    const blobName = `${type}-${Date.now()}.${fileExtension}`;
    const blockBlobClient = blobContainerClient.getBlockBlobClient(blobName);

    console.log(`Uploading ${type} to blob: ${blobName}`);

    await blockBlobClient.upload(data, data.length);

    const sasToken = await blockBlobClient.generateSasUrl({
      expiresOn: new Date(new Date().valueOf() + 3600 * 1000), // 1 hour from now
      permissions: BlobSASPermissions.parse("r")
    });

    return sasToken;
  }

  /**
   * Uploads a file to the Azure Blob storage.
   * @param filePath - The path of the file to upload.
   * @returns A Promise that resolves to the SAS (Shared Access Signature) URL of the uploaded file.
   */
  async uploadFileToBlob(filePath: string): Promise<string> {
    const blobType: BlobType = BlobType.File;
    const originalFileName = path.basename(filePath);
    const blobContainerClient = this.blobServiceClient.getContainerClient(config.azureBlobContainerName);
    const fileExtension = path.extname(filePath);
    const blobName = `${blobType}-${originalFileName.split('.')[0]}-${Date.now()}${fileExtension}`;
    const blockBlobClient = blobContainerClient.getBlockBlobClient(blobName);

    console.log(`Uploading ${blobType} to blob: ${blobName}`);

    // Read the file as a buffer to handle both text and binary files correctly
    const data = await fs.readFile(filePath);
    await blockBlobClient.upload(data, data.length);

    const sasUrl = await blockBlobClient.generateSasUrl({
      expiresOn: new Date(new Date().valueOf() + 3600 * 1000), // 1 hour from now
      permissions: BlobSASPermissions.parse("r")
    });

    return sasUrl;
  }

  async deleteBlob(blobName: string): Promise<void> {
    const blobContainerClient = this.blobServiceClient.getContainerClient(config.azureBlobContainerName);
    await blobContainerClient.deleteBlob(blobName);
  }

  /**
   * Uploads a base64 encoded image to an Azure Blob storage container.
   * @param base64Data - The base64 encoded image data.
   * @param type - The type of the image (e.g., 'image', 'file', 'folder').
   * @returns A Promise that resolves to the SAS (Shared Access Signature) URL of the uploaded image.
   */
  async uploadBase64ImageToBlob(base64Data: string, type: BlobType): Promise<string> {
    const data = Buffer.from(base64Data, 'base64');

    const blobContainerClient = this.blobServiceClient.getContainerClient(config.azureBlobContainerName);
    const blobName = `${type}-${Date.now()}.png`;
    const blockBlobClient = blobContainerClient.getBlockBlobClient(blobName);

    console.info(`Uploading ${type} image to blob: ${blobName}`);

    await blockBlobClient.upload(data, data.length, {
      blobHTTPHeaders: { blobContentType: 'image/png' }
    });

    const sasUrl = await this.generateBlobSasUrl(this.blobServiceClient, config.azureBlobContainerName, blobName);
    return sasUrl;
  }
}