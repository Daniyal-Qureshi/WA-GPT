import { sendReply } from '../services/maytapi';
import { handleDocumentProcessing, handleTextProcessing } from '../services/document';


export const handleWebhook = async (req:any, res:any) => {
  try {
    const body = req.body;

    if (!body || !body.message) {
      return res.status(400).send("Invalid request");
    }

    const {
      message,
      user: { phone },
    } = body;

    console.log({ phone, message });

    // Send immediate processing message
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

