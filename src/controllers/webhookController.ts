import { handleDocumentProcessing, handleTextProcessing } from '../services/document';
import { sendReply } from '../services/maytapi';
import { llmSelection } from "../services/llm";

export const handleWebhook = async (req: any, res: any) => {
  try {
    const body = req.body;
    if (!body || !body.message || !body.user ) {
      return res.status(400).send("Invalid request");
    }

    const { message, user: { phone } } = body;
    const messageText = message.type == "text"  ?  message.text.trim() :  "";

    console.log("Message received from", phone, ":", message);
    
    const isLLMSelected = await llmSelection(phone, messageText);

    if(!isLLMSelected) {
      return;
    }

    await sendReply(phone, "⏳ Processing your request...");

    if (message.type === "text") {
      const userInput = message.text.trim();
      await handleTextProcessing(phone, userInput);
    } else {
      const result = await handleDocumentProcessing(phone, message);
    }

    res.status(200).send("Webhook processed successfully");
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send("Internal Server Error");
  }
};