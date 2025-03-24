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
  
  let faqs: string[];

  try {
      faqs = JSON.parse(faqsResponse);
      if (!Array.isArray(faqs)) {
          throw new Error("Parsed FAQs is not an array");
      }
      
      await setFAQsInRedis(phone, faqs);

      const faqList = faqs
        .slice(0, 10)
        .map((question, index) => `${index + 1}. ${question}`)
        .join('\n');
    
      const messageText = `📌 *FAQs from your document:*\n\n${faqList}\n\n👉 Reply with the number of the question you want to ask.`;
    
      await sendReply(phone, messageText);  
  
    } catch (error) {
      console.error("Invalid JSON response for FAQs:", error);
      await sendReply(phone, 'Your document has been processed\n Please send your queries');
      return { status: 'Failed to parse FAQs.' };
     }

  return { status: 'FAQs processed successfully.' };
};

module.exports = {
  handleTextProcessing,
  handleDocumentProcessing,
};