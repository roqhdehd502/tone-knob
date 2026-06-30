import * as PortOne from "@portone/browser-sdk/v2";

import { api } from "./api";

export interface RequestSubscriptionParams {
  orderName: string;
  amount: number;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
}

/**
 * PortOne V2 정기결제 (빌링키 발급 + 최초 결제)
 * 1. 백엔드에서 결제 레코드 생성 (pending)
 * 2. PortOne SDK requestIssueBillingKeyAndPay 호출
 * 3. 백엔드 서버 측 검증 + 빌링키 저장
 */
export async function requestSubscriptionPayment(
  params: RequestSubscriptionParams,
): Promise<{ paymentId: string; billingKey: string }> {
  const config = await api.payments.getConfig();

  // 1. 백엔드 결제 레코드 생성
  const payment = await api.payments.create({
    type: "subscription",
    amount: params.amount,
    metadata: { orderName: params.orderName },
  });

  const portonePaymentId = `${payment.externalOrderId}`;

  // 2. PortOne SDK 빌링키 발급 + 최초 결제
  const response = await PortOne.requestIssueBillingKeyAndPay({
    storeId: config.storeId,
    channelKey: config.channelKey,
    paymentId: portonePaymentId,
    orderName: params.orderName,
    totalAmount: params.amount,
    currency: "KRW",
    payMethod: "CARD",
    customer: {
      customerId: params.customerId,
      fullName: params.customerName,
      email: params.customerEmail,
    },
  });

  if (response?.code) {
    throw new Error(response.message ?? "결제가 취소되었습니다");
  }
  if (!response?.paymentId || !response?.billingKey) {
    throw new Error("결제 응답에서 paymentId 또는 billingKey를 확인할 수 없습니다");
  }

  // 3. 백엔드 서버 측 검증 + 빌링키 저장
  await api.payments.confirmBillingKey(payment.id, response.paymentId, response.billingKey);

  return { paymentId: payment.id, billingKey: response.billingKey };
}
