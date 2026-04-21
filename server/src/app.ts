import express from 'express';
import { authRouter } from './routes/auth.route';
import { billingRouter } from './routes/billing.route';

const app = express();

app.use(express.json());
app.use('/auth', authRouter);
app.use('/billing', billingRouter);

export { app };
