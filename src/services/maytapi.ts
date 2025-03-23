import axios from 'axios';
import { MAYTAPI_API_URL, MAYTAPI_TOKEN } from '../config';


export const sendReply = async (phone: string, message: any, type: string = "text") => {
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
    
  } catch (error: any) {
    console.log("Error sending message:", error.response?.data || error.message);
  }
};