import { redisClient } from '../config';

export const getFAQsFromRedis = async (phone: string) => {
  const faqs = await redisClient.get(`faq:${phone}`);
  return faqs ? JSON.parse(faqs) : [];
};

export const setFAQsInRedis = async (phone: string, faqs: string[]) => {
  await redisClient.set(`faq:${phone}`, JSON.stringify(faqs.slice(0, 10)));
};