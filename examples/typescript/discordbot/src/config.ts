import * as dotenv from "dotenv";

dotenv.config();

export const config = {
  discordBotToken: process.env.DISCORD_BOT_TOKEN,
  openaiApiKey: process.env.OPENAI_API_KEY,
  azureStorageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || "",
  azureBlobContainerName: process.env.AZURE_BLOB_CONTAINER_NAME || "",
  azureStorageAccountName: process.env.AZURE_STORAGE_ACCOUNT_NAME || "",
  azureStorageAccountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY || "",
};