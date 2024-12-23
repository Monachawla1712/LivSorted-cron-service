export class SplAggregate {
  constructor(storeId: string, finalBillAmount: number) {
    this.storeId = storeId;
    this.finalBillAmount = finalBillAmount;
  }
  storeId: string;
  finalBillAmount: number;
}
