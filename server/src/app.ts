import express from 'express';
import { authRouter } from './routes/auth.route';

const app = express();

app.use(express.json());
app.use('/auth', authRouter);

export { app };
