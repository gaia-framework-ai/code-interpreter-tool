import { Client, GatewayIntentBits, Partials } from "discord.js";
import { getBotResponse } from "../example_openai";

/**
 * Represents a Discord bot that interacts with the Discord API.
 */
export class DiscordBot {
  private client: Client;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages
      ],
      partials: [Partials.Channel],
    });
  }

  /**
   * Starts the Discord bot and sets up event listeners for message creation and bot readiness.
   */
  start() {
    this.client.on("ready", async () => {
      console.log(`Discord bot logged in as ${this.client.user?.tag}!`);
    });

    this.client.on("messageCreate", async (message) => {
      if (message.author.bot) return;

      message.channel.sendTyping();

      // Query open AI with the message content, utilizing
      // discord for the input and output of chats
      const response = await getBotResponse(message.content);
      await message.channel.send(response ?? "Failed to get response from bot");
    });

    this.client.login(process.env.DISCORD_BOT_TOKEN);
  }
}