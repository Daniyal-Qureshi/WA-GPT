import { Settings } from "llamaindex";
import { OpenAI, OpenAIEmbedding } from "@llamaindex/openai";
import { Groq } from "@llamaindex/groq";
import { Gemini, GEMINI_MODEL } from "@llamaindex/google";
import { handleDocumentProcessing, handleTextProcessing } from '../services/document';
import { sendReply } from '../services/maytapi';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

const modelOptions: any = {
  "OpenAI GPT-4": new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
  "Groq Llama3": new Groq({ model: "llama3-70b-8192", apiKey: process.env.GROQ_API_KEY }),
  "Gemini": new Gemini({ model: GEMINI_MODEL.GEMINI_PRO_1_5_FLASH })
};

const userPreferences: Record<string, string> = {}; 

export const handleWebhook = async (req: any, res: any) => {
  try {
    const body = req.body;
    if (!body || !body.message) {
      return res.status(400).send("Invalid request");
    }

    const { message, user: { phone } } = body;
    
    console.log("Message received from", phone, ":", message);

    if (!userPreferences[phone]) {
      const optionsText = "Please select a model:\n" +
        Object.keys(modelOptions).map((key, index) => `${index + 1}. ${key}`).join("\n");

      await sendReply(phone, optionsText);
      userPreferences[phone] = "awaiting_selection"; // Mark that the user needs to select a model
      return res.status(200).send("Model selection message sent.");
    }

    // If user is selecting a model
    if (userPreferences[phone] === "awaiting_selection") {
      const selectedModel = Object.keys(modelOptions)[parseInt(message.text.trim()) - 1];
      if (!selectedModel) {
        await sendReply(phone, "Invalid selection. Please enter a valid number from the list.");
        return res.status(200).send("Invalid selection.");
      }

      userPreferences[phone] = selectedModel;
      await sendReply(phone, `✅ Model selected: ${selectedModel}\nYou can now send your queries.`);
      return res.status(200).send("Model selected.");
    }

    const selectedModelName = userPreferences[phone];
    Settings.llm = modelOptions[selectedModelName];

    await sendReply(phone, "⏳ Processing your request...");

    if (message.type === "text") {
      const userInput = message.text.trim();
      await handleTextProcessing(phone, userInput);
    } else {
      const result = await handleDocumentProcessing(phone, message);

      if (result.status === "No FAQs generated.") {
        return res.status(200).send(result.status);
      }
    }

    res.status(200).send("Webhook processed successfully");
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send("Internal Server Error");
  }
};
