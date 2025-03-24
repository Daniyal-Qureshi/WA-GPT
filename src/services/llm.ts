import { Settings } from "llamaindex";
import { OpenAI, OpenAIEmbedding } from "@llamaindex/openai";
import { Groq } from "@llamaindex/groq";
import { Gemini, GEMINI_MODEL } from "@llamaindex/google";
import { handleDocumentProcessing, handleTextProcessing } from '../services/document';
import { sendReply } from '../services/maytapi';
import dotenv from 'dotenv';
import path from 'path';
import { redisClient } from "../config";

dotenv.config({ path: path.join(__dirname, '../../.env') });

const modelOptions: any = {
  "OpenAI GPT-4": new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
  "Groq Llama3": new Groq({ model: "llama3-70b-8192", apiKey: process.env.GROQ_API_KEY }),
  "Gemini": new Gemini({ model: GEMINI_MODEL.GEMINI_PRO_1_5_FLASH })
};



export const llmSelection = async (phone: string, message: string) => {
  // Check if the user has a model preference stored in Redis
  const userPreference = await redisClient.get(`user:${phone}:model`);

  if (!userPreference) {
    const optionsText = "Please select a model:\n" +
      Object.keys(modelOptions).map((key, index) => `${index + 1}. ${key}`).join("\n");

    await sendReply(phone, optionsText);
    await redisClient.set(`user:${phone}:model`, "awaiting_selection");
    return false;
  }

  // If the user is in the process of selecting a model
  if (userPreference === "awaiting_selection") {
    const selectedModel = Object.keys(modelOptions)[parseInt(message.trim()) - 1];
    if (!selectedModel) {
      await sendReply(phone, "Invalid selection. Please enter a valid number from the list.");
      return false;
    }

    // Store the selected model in Redis
    await redisClient.set(`user:${phone}:model`, selectedModel);
    await sendReply(phone, `✅ Model selected: ${selectedModel}\nYou can now send your queries.`);
    Settings.llm = modelOptions[selectedModel as string];

    return false;

  }

  return true;
};
