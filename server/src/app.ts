import express from 'express';
import { authRouter } from './routes/auth.route';
import { attendanceRouter } from './routes/attendance.route';
import { billingRouter } from './routes/billing.route';

const app = express();

app.use(express.json());
app.use('/auth', authRouter);
app.use('/attendance', attendanceRouter);
app.use('/billing', billingRouter);

export { app };
