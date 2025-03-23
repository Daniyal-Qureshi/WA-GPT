import express from 'express';
import { handleWebhook } from '../controllers/webhookController';

const router = express.Router();


router.post('/webhook', handleWebhook);

// router.get("/", (req, res) => { 
//     res.send("Welcome to the WhatsApp Webhook API");
// })

export default router;