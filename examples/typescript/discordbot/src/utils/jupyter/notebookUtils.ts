import path from "path";
import { BlobType, JupyterNotebook } from "../types";
import { NotebookParser } from "./NotebookParser";
import * as fs from 'fs';
import { AzureBlobService } from "../../blob/AzureBlobService";

/**
 * Builds the tool response based on the stdout and output directory.
 * @param stdout - The stdout from the tool execution.
 * @param outputDir - The output directory where the extracted outputs will be stored.
 * @returns A Promise that resolves to an object containing the extracted outputs.
 */
export async function buildToolResponse(stdout: string, outputDir: string): Promise<any> {
  const parser = new NotebookParser(stdout);
  const notebook: JupyterNotebook = parser.getNotebook();

  const plainTextOutputs = await extractPlainTextOutputs(notebook, outputDir);
  const textOutputs = extractTextOutputs(notebook);
  const imageUrls = await extractImageUrls(notebook, outputDir);

  return {
    ...(imageUrls.length > 0 && { imageUrls }),
    textOutputs,
    plainTextOutputs
  };
}

/**
 * Extracts plain text outputs from a Jupyter notebook and processes them.
 * 
 * @param notebook - The Jupyter notebook object.
 * @param outputDir - The directory where the processed outputs will be saved.
 * @returns A promise that resolves to an array of processed outputs.
 */
async function extractPlainTextOutputs(notebook: JupyterNotebook, outputDir: string): Promise<any[]> {
  return Promise.all(notebook.cells.map(async cell => {
    const output = cell.outputs.find(output => output.output_type === 'execute_result');
    let data = output?.data && output.data['text/plain'] || '';

    if (data === '') {
      return data;
    }

    return processCellOutputData(data, outputDir); // Use the new function here
  }));
}

/**
 * Processes the cell output data and returns the file path(s) or uploads the file(s) to blob storage and returns the blob URL(s).
 * @param data - The cell output data to process. It can be a string or an array of strings.
 * @param outputDir - The output directory where the files will be saved.
 * @returns A promise that resolves to the file path(s) or the blob URL(s) of the processed data.
 */
async function processCellOutputData(data: string | string[], outputDir: string): Promise<string | string[]> {
  if (typeof data === 'string') {
    const updatedFile = extractPath(data).split('/mnt/data/')[1];
    const filePath = path.join(outputDir, updatedFile);

    const isBlobAvailable = AzureBlobService.isBlobStorageAvailable();
    if (!isBlobAvailable) {
      return filePath;
    }

    const azureBlobService = new AzureBlobService();
    data = await azureBlobService.uploadFileToBlob(filePath);
  }

  if (Array.isArray(data)) {
    return Promise.all(
      data.map(async (item) => {
        if (!item.startsWith('/mnt/data') && !item.startsWith("'/mnt/data")) {
          return item;
        }

        const updatedFile = extractPath(item).split('/mnt/data/')[1];
        const filePath = path.join(outputDir, updatedFile);

        const isBlobAvailable = AzureBlobService.isBlobStorageAvailable();
        if (!isBlobAvailable) {
          return filePath;
        }

        // Upload the file to blob storage and return the blob URL
        // for the LLM to return to the user
        const azureBlobService = new AzureBlobService();
        return azureBlobService.uploadFileToBlob(filePath);
      })
    );
  }

  console.warn("Unexpected data type in cell output:", typeof data);
  return data;
}

/**
 * Extracts text outputs from a Jupyter notebook.
 * @param notebook - The Jupyter notebook object.
 * @returns An array of strings representing the extracted text outputs.
 */
function extractTextOutputs(notebook: JupyterNotebook): string[] {
  // Extract text outputs from the notebook on stream
  const textOutputs = notebook.cells.flatMap(cell => {
    const output = cell.outputs.find(output => output.output_type === 'stream');
    return output?.text || '';
  });

  return textOutputs.filter(text => text !== '');
}

/**
 * Extracts base64 images from a Jupyter notebook and saves them to the specified output directory.
 * @param notebook - The Jupyter notebook object.
 * @param outputDir - The output directory where the images will be saved.
 * @returns A promise that resolves to an array of file paths of the saved images.
 */
async function extractImageUrls(notebook: JupyterNotebook, outputDir: string): Promise<string[]> {
  // Extract base64 images from the notebook on display_data
  const base64Images = notebook.cells.map(cell => {
    const output = cell.outputs.find(output => output.output_type === 'display_data');
    return output?.data && output.data['image/png'] || '';
  }).filter(image => image !== '');

  return await Promise.all(base64Images.map(async (base64Image, index) => {
    const isBlobAvailable = AzureBlobService.isBlobStorageAvailable();
    if (!isBlobAvailable) {
      // In this example, we return the sandbox file path
      const filePath = path.join(outputDir, `image_${index}.png`);
      await fs.promises.writeFile(filePath, base64Image, 'base64');
      return filePath;
    }

    // Upload the file to blob storage and return the blob URL
    // for the LLM to return to the user
    const azureBlobService = new AzureBlobService();
    const imageUrl = await azureBlobService.uploadBase64ImageToBlob(base64Image, BlobType.Image);
    return imageUrl;
  }));
}

const extractPath = (text: string) => {
  // Extracts path from a string that might be surrounded by single quotes,
  // e.g., "'/mnt/data/file.txt'" -> "/mnt/data/file.txt"

  const match = text.match(/'([^']*)'/); // Match innermost single quotes
  return match ? match[1] : text; // Return the captured group if match is found, else return original text
};