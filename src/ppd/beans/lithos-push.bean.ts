export class LithosPushBean {
  /**
   * id : orderId
   */
  id: any;

  customerId: any;

  lithosOrderId: number;

  storeId: string;

  finalBillAmount: number;

  shippingMethod: string;

  paymentMethod: any;

  status: string;

  deliveryAddress: number;

  submittedAt: any;

  totalSpGrossAmount: number;

  totalDiscountAmount: number;

  channel: string;

  orderItems: LithosItems[];

  notes: string;

  metadata: any;

  offerData: any;

  payment: any;
}

export class LithosItems {
  skuCode: string;

  uom: string;

  finalQuantity: number;

  salePrice: number;

  spGrossAmount: number;

  finalAmount: number;

  discountAmount: number;

  metadata: object;

  name: string;
}
