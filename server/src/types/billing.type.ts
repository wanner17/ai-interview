export type ChargePackageId = 'starter' | 'standard' | 'pro';

export type CreateChargeOrderRequest = {
  packageId: ChargePackageId;
};

export type ConfirmChargeRequest = {
  paymentKey: string;
  orderId: string;
  amount: number;
};

export type TossConfirmRequest = {
  paymentKey: string;
  orderId: string;
  amount: number;
};

export type TossPayment = {
  paymentKey: string;
  orderId: string;
  orderName?: string;
  method?: string;
  totalAmount: number;
  status: string;
  approvedAt?: string | null;
  requestedAt?: string | null;
};

export type TossWebhookPayload = {
  eventType?: string;
  createdAt?: string;
  data?: TossPayment;
  orderId?: string;
  status?: string;
  secret?: string;
};

export type ChargePackage = {
  packageId: ChargePackageId;
  amountKrw: number;
  cashAmount: number;
  orderName: string;
};
