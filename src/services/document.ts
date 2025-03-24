import { sendReply } from './maytapi';
import { getFAQsFromRedis, setFAQsInRedis } from './faqs';
import { processAndStoreDocument, chatWithDocument } from './rag';
import "../config"

// Handle text processing logic
export const handleTextProcessing = async (phone:string, userInput:string) => {
  const parsedFaqs = await getFAQsFromRedis(phone);
  const selectedFaqIndex = parseInt(userInput) - 1;

  if (!isNaN(selectedFaqIndex) && parsedFaqs[selectedFaqIndex]) {
    const selectedFaq = parsedFaqs[selectedFaqIndex];
    const response = await chatWithDocument(phone, selectedFaq);

    const replyMessage = `📌 *Question:* ${selectedFaq}\n\n✅ *Answer:* ${response}`;
    await sendReply(phone, replyMessage);
  } else {
    const response = await chatWithDocument(phone, userInput);
    await sendReply(phone, response);
  }
};

// Handle document processing logic
export const handleDocumentProcessing = async (phone:string, message:string) => {
  const faqsResponse = await processAndStoreDocument(message, phone);
  if(faqsResponse?.error) {
    await sendReply(phone, 'Unsupported Document, please try with another one' );
    return { status: 'No FAQs generated.' };
  }
  
  const faqs:string[] = JSON.parse(faqsResponse);

  if (!faqs || faqs.length === 0) {
    await sendReply(phone, 'No FAQs found in the document.');
    return { status: 'No FAQs generated.' };
  }

  // Store FAQs in Redis
  await setFAQsInRedis(phone, faqs);

  const faqList = faqs
    .slice(0, 10)
    .map((question, index) => `${index + 1}. ${question}`)
    .join('\n');

  const messageText = `📌 *FAQs from your document:*\n\n${faqList}\n\n👉 Reply with the number of the question you want to ask.`;

  await sendReply(phone, messageText);

  return { status: 'FAQs processed successfully.' };
};

module.exports = {
  handleTextProcessing,
  handleDocumentProcessing,
};