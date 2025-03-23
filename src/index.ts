
import express from 'express';
import webhookRoutes from './routes/webhookRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api', webhookRoutes);


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});