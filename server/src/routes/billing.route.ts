import { Router } from 'express';
import { billingController } from '../controllers/billing.controller';

const billingRouter = Router();

billingRouter.get('/packages', billingController.getPackages);
billingRouter.get('/balance', billingController.getBalance);
billingRouter.get('/orders/:orderId', billingController.getOrder);
billingRouter.post('/orders/charge', billingController.createChargeOrder);
billingRouter.post('/orders/confirm', billingController.confirmCharge);
billingRouter.post('/webhooks/toss', billingController.handleTossWebhook);

export { billingRouter };
