import { redisClient } from "./config";

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

const { processAndStoreDocument, chatWithDocument } = require("./rag")


dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());


const MAYTAPI_API_URL = `https://api.maytapi.com/api/${process.env.MAYTAPI_PRODUCT_ID}/${process.env.MAYTAPI_INSTANCE_ID}`;
const MAYTAPI_TOKEN = process.env.MAYTAPI_TOKEN;


async function sendReply(phone: string, message: any, type: string = "text") {
  try {
    const payload = {
      to_number: phone,
      type,
      ...(type === "text" ? { message } : { interactive: message }),
    };

    const res = await axios.post(
      `${MAYTAPI_API_URL}/sendMessage`,
      payload,
      { headers: { "x-maytapi-key": MAYTAPI_TOKEN } }
    );

    console.log("Response:", res.data);
  } catch (error:any) {
    console.log("Error sending message:", error.response?.data || error.message);
  }
}



app.get("/", (req: any, res: any) => {

  res.send("Hello World!");
})


const faqStorage: { [phone: string]: string[] } = {};

app.post('/webhook', async (req:any, res:any) => {
  try {
    const body = req.body;

    if (!body || !body.message) {
      return res.status(400).send('Invalid request');
    }

    const { message, user: { phone } } = body;

    console.log({ phone, message });

    // Send immediate processing message
    await sendReply(phone, '⏳ Processing your request...');

    if (message.type === 'text') {
      const userInput = message.text.trim();
      const selectedFaqIndex = parseInt(userInput) - 1;

      // Retrieve FAQs from Redis
      const faqs = await redisClient.get(`faq:${phone}`);
      const parsedFaqs = faqs ? JSON.parse(faqs) : [];

      if (!isNaN(selectedFaqIndex) && parsedFaqs[selectedFaqIndex]) {
        const selectedFaq = parsedFaqs[selectedFaqIndex];

        // Generate response based on the selected FAQ
        const response = await chatWithDocument(phone, selectedFaq);

        // Send both the question and answer
        const replyMessage = `📌 *Question:* ${selectedFaq}\n\n✅ *Answer:* ${response}`;
        await sendReply(phone, replyMessage);
      } else {
        // Handle regular chat
        const response = await chatWithDocument(phone, message.text);
        await sendReply(phone, response);
      }
    } else {
      // Process document and extract FAQs
      const faqsResponse = await processAndStoreDocument(message, phone);
      const faqs:string[] = JSON.parse(faqsResponse);

      if (!faqs || faqs.length === 0) {
        await sendReply(phone, 'No FAQs found in the document.');
        return res.status(200).send('No FAQs generated.');
      }

      // Store FAQs in Redis
      await redisClient.set(`faq:${phone}`, JSON.stringify(faqs.slice(0, 10)));

      const faqList = faqs
        .slice(0, 10)
        .map((question, index) => `${index + 1}. ${question}`)
        .join('\n');

      const messageText = `📌 *FAQs from your document:*\n\n${faqList}\n\n👉 Reply with the number of the question you want to ask.`;

      await sendReply(phone, messageText);
    }

    res.status(200).send('Webhook processed successfully');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

