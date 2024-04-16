import * as dotenv from "dotenv";
dotenv.config();

import { DiscordBot } from "./bot/DiscordBot";
new DiscordBot().start();