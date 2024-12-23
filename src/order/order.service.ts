import { Between, DataSource, In, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { OrderEntity } from './order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderItemsEntity } from './order-items.entity';
import * as moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { ProductEntity } from '../store/product.entity';
import { FranchiseOrderEntity } from './franchise-order.entity';
import { SplAggregate } from '../events/classes/spl-aggregate';
import { OrderWeightBean } from './classes/order-weight.bean';
import { CustomLogger } from '../core/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

const CATEGORY_ID_MAP = {
  17: 'Non veg',
  16: 'Veg',
  18: 'Non cffveg',
  19: 'Fruits',
  20: 'Vegetables',
  21: 'Exotic Vegetables',
};

@Injectable()
export class OrderService {
  private readonly logger = new CustomLogger(OrderService.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(FranchiseOrderEntity)
    private readonly franchiseOrderRepository: Repository<FranchiseOrderEntity>,
    @InjectRepository(OrderItemsEntity)
    private readonly orderItemsRepository: Repository<OrderItemsEntity>,
    private dataSource: DataSource,
  ) {}

  async getNewOrders() {
    return await this.orderRepository.find({
      where: {
        status: 1,
        active: 1,
        delivery_date: this.getDeliveryDate(),
      },
    });
  }

  async getAllCarts() {
    return await this.orderRepository.find({
      where: {
        status: 0,
        active: 1,
      },
    });
  }

  extractUserIdsFromCarts(cartsList: OrderEntity[]) {
    const list = cartsList.map((cart) => {
      return cart.customer_id;
    });
    return list;
  }

  async getOrderItems(id: string): Promise<OrderItemsEntity[]> {
    const cartItems = await this.orderItemsRepository.find({
      where: { order_id: id, active: 1 },
    });
    return cartItems;
  }

  async saveCart(cart: OrderEntity) {
    await this.orderRepository.save(cart);
    return true;
  }

  async cancelCart(cart: OrderEntity) {
    cart.status = 10;
    await this.saveCart(cart);
  }

  async getOrdersCount(userId: string): Promise<number> {
    return await this.orderRepository.countBy({
      customer_id: userId,
      active: 1,
      status: 8,
    });
  }

  getDeliveryDate(): Date {
    const date = moment().add(5.5, 'hours');
    const localDate = date.toDate();
    return localDate;
  }

  createNewOrderItemEntity(
    product: ProductEntity,
    cartId: string,
    finalQuantity: string,
  ): OrderItemsEntity {
    const orderItemObject = {
      id: uuidv4(),
      order_id: cartId,
      sku_code: product.sku_code,
      product_name: product.name,
      uom: product.unit_of_measurement,
      image_url: product.image_url,
      category_id: product.category_id,
      category_name: CATEGORY_ID_MAP[product.category_id],
      ordered_qty: '0.0',
      marked_price: String(product.market_price),
      tax_details: {
        cgst: 0,
        sgst: 0,
        igst: 0,
        cessgst: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        cessAmount: 0,
      },
      product_tags: [],
      sale_price: String(product.sale_price),
      tax_amount: '0.00',
      final_amount: '0.00',
      sp_gross_amount: '0.00',
      discount_amount: '0.00',
      additional_discount: { offerDiscount: null },
      final_quantity: finalQuantity,
      active: 1,
      created_at: new Date(Date.now()),
      created_by: '01b6686b-6c23-4614-ad0b-9bd21fd2a146',
      modified_at: new Date(Date.now()),
      modified_by: '01b6686b-6c23-4614-ad0b-9bd21fd2a146',
    } as OrderItemsEntity;
    const orderItemsEntity = new OrderItemsEntity();
    Object.assign(orderItemsEntity, orderItemObject);
    return orderItemsEntity;
  }

  async getOrdersFromStoreIdsAndDeliveryDate(
    storeIds: string[],
    deliveryDate: string,
  ) {
    return await this.franchiseOrderRepository.find({
      where: {
        storeId: In(storeIds),
        status: In([2, 4]),
        deliveryDate: deliveryDate,
        active: 1,
      },
    });
  }

  async getOrdersFromStoreIdsAndDeliveryDateRange(
    storeIds: string[],
    fromDate: string,
    toDate: string,
  ) {
    return await this.franchiseOrderRepository.find({
      where: {
        storeId: In(storeIds),
        status: In([0, 1, 2, 4]),
        deliveryDate: Between(fromDate, toDate),
        active: 1,
      },
    });
  }

  async getFranchiseOrderWithItemsFromId(id: string) {
    const order = await this.franchiseOrderRepository.findOne({
      where: { id: id },
      relations: ['franchiseOrderItems'],
    });
    return order;
  }

  async getFranchiseOrderItemsFrequencyByDays(
    averageDays: number,
    favoriteCount: number,
  ) {
    const subquery = this.franchiseOrderRepository
      .createQueryBuilder('fo')
      .select('fo.store_id', 'store_id')
      .addSelect('foi.sku_code', 'sku_code')
      .addSelect('COUNT(*)', 'count')
      .addSelect(
        'ROW_NUMBER() OVER (PARTITION BY fo.store_id ORDER BY COUNT(*) DESC)',
        'rank',
      )
      .innerJoin('franchise_order_items', 'foi', 'foi.order_id = fo.id')
      .where('fo.active = :active', { active: 1 })
      .andWhere('fo.status IN (:...status)', { status: [2, 4] })
      .andWhere('foi.active = :active', { active: 1 })
      .andWhere('fo.delivery_date >= :date', {
        date: new Date(Date.now() - averageDays * 24 * 60 * 60 * 1000),
      })
      .groupBy('fo.store_id, foi.sku_code');

    const query = this.dataSource
      .createQueryBuilder()
      .select(['store_id', 'sku_code', 'count'])
      .where('rank <= :rank', { rank: favoriteCount })
      .orderBy('store_id')
      .addOrderBy('count', 'DESC')
      .from(`(${subquery.getQuery()})`, 's')
      .setParameters(subquery.getParameters());

    const results = (await query.getRawMany()) as unknown as {
      store_id: string;
      sku_code: string;
      count: number;
    }[];
    return results;
  }

  async getFranchiseOrderItemsAverageQtyByDays(averageDays: number) {
    const results = (await this.franchiseOrderRepository
      .createQueryBuilder('fo')
      .select('fo.store_id', 'store_id')
      .addSelect('foi.sku_code', 'sku_code')
      .addSelect(
        'CAST(SUM(foi.final_quantity) / COUNT(DISTINCT fo.id) AS DECIMAL)',
        'avg_quantity_per_order',
      )
      .innerJoin('franchise_order_items', 'foi', 'foi.order_id = fo.id')
      .where('fo.active = :active', { active: 1 })
      .andWhere('fo.status IN (:...status)', { status: [2, 4] })
      .andWhere('foi.active = :active', { active: 1 })
      .andWhere('fo.delivery_date >= :deliveryDate', {
        deliveryDate: new Date(
          new Date().getTime() - averageDays * 24 * 60 * 60 * 1000,
        ),
      })
      .groupBy('fo.store_id, foi.sku_code')
      .getRawMany()) as unknown as {
      store_id: string;
      sku_code: string;
      numOrders: number;
      avg_quantity_per_order: number;
    }[];
    return results;
  }

  async getOrderAggregateObject(entityId, deliveryDate: string) {
    const franchiseOrders = await this.franchiseOrderRepository.find({
      where: {
        storeId: entityId,
        status: In([2, 4]),
        deliveryDate: deliveryDate,
        active: 1,
      },
    });
    return this.aggregateOrder(franchiseOrders, entityId);
  }

  private aggregateOrder(
    franchiseOrders: FranchiseOrderEntity[],
    storeId: string,
  ) {
    let aggregatedOrder: SplAggregate = null;
    for (const franchiseOrder of franchiseOrders) {
      if (franchiseOrder.storeId === storeId) {
        if (aggregatedOrder == null) {
          aggregatedOrder = new SplAggregate(
            storeId,
            franchiseOrder.finalBillAmount,
          );
        } else {
          aggregatedOrder.finalBillAmount += franchiseOrder.finalBillAmount;
        }
      }
    }
    return aggregatedOrder;
  }

  async getNewFranchiseOrdersForRouting() {
    const franchiseOrders = await this.franchiseOrderRepository
      .createQueryBuilder('fo')
      .select('fo.store_id', 'storeId')
      .addSelect('fo.display_order_id', 'displayOrderId')
      .addSelect('fo.delivery_date', 'deliveryDate')
      .addSelect('fo.slot', 'slot')
      .addSelect('foi.wh_id::INTEGER', 'whId')
      .addSelect('CAST(SUM(foi.final_quantity) AS DECIMAL)', 'orderWeight')
      .innerJoin('franchise_order_items', 'foi', 'foi.order_id = fo.id')
      .where('foi.active = :foiActive', { foiActive: 1 })
      .andWhere('fo.active = :foActive', { foActive: 1 })
      .andWhere('fo.status in (:...foStatus)', { foStatus: [1] })
      .andWhere(
        "fo.delivery_date = DATE_TRUNC('day', NOW() + INTERVAL '340 minutes')",
      )
      .groupBy(
        'fo.store_id, fo.display_order_id, foi.wh_id, fo.slot,fo.delivery_date',
      );

    return (await franchiseOrders.getRawMany()) as unknown as OrderWeightBean[];
  }

  async getLastNDaysDistinctActiveStores(n: number) {
    const lastSevenDaysDate = new Date(
      new Date().getTime() - n * 24 * 60 * 60 * 1000,
    );
    const distinctStoreIds = await this.franchiseOrderRepository
      .createQueryBuilder('fo')
      .select('DISTINCT fo.storeId', 'storeId')
      .where('fo.active = :active', { active: 1 })
      .andWhere('fo.status IN (:...status)', { status: [1, 2, 4] })
      .andWhere('fo.delivery_date > :lastSevenDays', {
        lastSevenDays: lastSevenDaysDate,
      })
      .getRawMany();
    return distinctStoreIds.map((result) => result.storeId);
  }
}
