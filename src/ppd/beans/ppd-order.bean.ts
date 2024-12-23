export class PpdOrderBean {
  order_id: any;

  display_order_id: string;

  sequence_no: number;

  zone: string;

  distance: number;

  picker_user_id?: number;

  packer_user_id?: number;

  supervisor_user_id?: number;

  status: string;

  metadata: object;

  order_items: Items[];

  delivery_date: string;

  pps: number;
}

class Items {
  sku_code: string;
  productName?: string;
  uom: string;
  categoryId?: number;
  categoryName?: string;
  orderedQty?: number;
  finalQty?: number;
  salePrice?: number;
  finalBillAmount?: number;
  metadata: object;
}
