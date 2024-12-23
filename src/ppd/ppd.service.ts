import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { OrderService } from '../order/order.service';
import { OrderEntity } from '../order/order.entity';
import { PpdOrderBean } from './beans/ppd-order.bean';
import { InjectRepository } from '@nestjs/typeorm';
import { PpdEntity } from 'src/ppd/ppd.entity';
import axios from 'axios';
import * as process from 'process';
import { PpdDispatchEntity } from './ppd-dispatch.entity';
import { PpdPickersPackersSupervisorsEntity } from './ppd-pickers-packers-supervisors.entity';
import { OrderItemsEntity } from '../order/order-items.entity';
import { RoutingResponse } from './classes/routing-response';
import { RoutingRequest, ZoneOrder } from './classes/routing-request';
import { ConfigService } from '@nestjs/config';
import { CustomLogger } from '../core/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

let pps = 0;

@Injectable()
export class PpdService {
  private readonly logger = new CustomLogger(PpdService.name);
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    private configService: ConfigService,
    private orderService: OrderService,
    @InjectRepository(PpdEntity, 'warehouseDB')
    private readonly ppdRepository: Repository<PpdEntity>,
    @InjectRepository(PpdDispatchEntity, 'warehouseDB')
    private readonly ppdDispatchEntityRepository: Repository<PpdDispatchEntity>,
    @InjectRepository(PpdPickersPackersSupervisorsEntity, 'warehouseDB')
    private readonly ppdPickersPackersSupervisorsEntityRepository: Repository<PpdPickersPackersSupervisorsEntity>,
  ) {}

  async createDispatchZone(zone: string, deliveryDate: Date) {
    try {
      const existingZoneEntity = await this.ppdDispatchEntityRepository.findOne(
        {
          where: {
            zone: zone,
            delivery_date: deliveryDate,
          },
        },
      );
      if (existingZoneEntity) {
        this.logger.log(
          this.asyncContext.get('traceId'),
          `${zone} zone with delivery Date ${deliveryDate} in ppd_dispatch already exist`,
        );
        return;
      }
      this.logger.log(
        this.asyncContext.get('traceId'),
        `creating ${zone} zone in ppd_dispatch`,
      );
      const zoneEntity = new PpdDispatchEntity();
      zoneEntity.zone = zone;
      zoneEntity.delivery_date = deliveryDate;
      zoneEntity.created_on = new Date(Date.now());
      zoneEntity.created_by = '01b6686b-6c23-4614-ad0b-9bd21fd2a146';
      zoneEntity.modified_on = new Date(Date.now());
      zoneEntity.modified_by = '01b6686b-6c23-4614-ad0b-9bd21fd2a146';
      await this.ppdDispatchEntityRepository.save(zoneEntity);
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong',
        e,
      );
    }
  }

  async startPpdCron() {
    this.logger.log(
      this.asyncContext.get('traceId'),
      '\n\n-------------------- PPD CRON STARTED  ---------------------\n\n',
    );
    const ordersList = await this.orderService.getNewOrders();
    const zoneMap = new Map<string, OrderEntity[]>();
    for (const order of ordersList) {
      const key = order.metadata['zoneId'];
      const deliveryDate = order.delivery_date;
      if (!zoneMap.has(key)) {
        zoneMap.set(key, [order]);
        await this.createDispatchZone(key, deliveryDate);
      } else {
        zoneMap.get(key).push(order);
      }
    }
    const promiseArray: Promise<boolean>[] = [];
    for (const zone of zoneMap.keys()) {
      promiseArray.push(this.processZoneOrders(zoneMap.get(zone)));
    }
    const res = await Promise.all(promiseArray);
    pps = 0;
    this.logger.log(
      this.asyncContext.get('traceId'),
      '\n\n-------------------- PPD CRON END  ---------------------\n\n',
    );
    return true;
  }

  async processZoneOrders(orderList: OrderEntity[]): Promise<boolean> {
    const routeMap = await this.getRoutingMap(orderList);
    if (routeMap == null) {
      orderList.sort((i1: OrderEntity, i2: OrderEntity) => {
        const vib1 = Number(i1.metadata['storeDistance']);
        const vib2 = Number(i2.metadata['storeDistance']);
        return vib1 - vib2;
      });
    }
    let seq = 0;
    const ordersCount = orderList.length;
    const routeCapacity = 7;
    const routeCount = Math.floor(
      (ordersCount + routeCapacity - 1) / routeCapacity,
    );
    const distributionCount = Math.floor(ordersCount / routeCount);
    let extraOrders = ordersCount % routeCount;
    this.logger.log(
      this.asyncContext.get('traceId'),
      `orders Count: ${ordersCount}, routeCapacity: ${routeCapacity}, routeCount: ${routeCount}, distributionCount: ${distributionCount}, extraOrders: ${extraOrders}`,
    );
    let count = distributionCount;
    if (extraOrders > 0) {
      count = distributionCount + 1;
      extraOrders--;
    }
    let route = 1;
    for (const order of orderList) {
      const orderItems = await this.orderService.getOrderItems(order.id);
      const items: OrderItemsEntity[] = [];
      for (let j = 0; j < orderItems.length; j++) {
        this.logger.log(
          this.asyncContext.get('traceId'),
          `metabase orderItems data for item : ${orderItems[j].id} `,
        );
        const itemObj: OrderItemsEntity = this.createItemObject(orderItems[j]);
        items.push(itemObj);
      }
      const address = (await this.getAddress(order.delivery_address))['data'];
      if (count == 0) {
        route += 1;
        if (extraOrders > 0) {
          count = distributionCount + 1;
          extraOrders--;
        } else {
          count = distributionCount;
        }
      }
      pps++;
      if (routeMap != null) {
        route = routeMap.get(order.display_order_id).routeNum;
        seq = routeMap.get(order.display_order_id).seqNum - 1;
      }
      const ppdOrderBean = this.createPpdOrderBean(
        order,
        items,
        route,
        address,
        pps,
        seq,
      );
      count--;
      seq += 1;
      try {
        this.logger.log(
          this.asyncContext.get('traceId'),
          `Save order in ppd_orders for orderId: ${order.id}`,
        );
        await this.ppdRepository.save(ppdOrderBean);
      } catch (e) {
        this.logger.error(
          this.asyncContext.get('traceId'),
          'Something went wrong',
          e,
        );
      }
    }
    await this.startPickersPackersSupervisorsAssignment();
    return true;
  }

  async checkPickerPackerSupervisorAssignment(
    zone: string,
    deliveryDate: Date,
    pickerId: number,
    packerId: number,
    supervisorId: number,
  ): Promise<boolean> {
    const orders = await this.getPpdOrders(zone, deliveryDate);
    if (orders.length != 0) {
      const existingPicker = orders[0].picker_user_id;
      const existingPacker = orders[0].picker_user_id;
      const existingSupervisor = orders[0].supervisor_user_id;
      if (
        (existingPicker && existingPacker && existingSupervisor) ||
        (existingPicker == null &&
          existingPacker == null &&
          existingSupervisor == null)
      ) {
        if (
          existingPicker == pickerId &&
          existingPacker == packerId &&
          existingSupervisor == supervisorId
        ) {
          return true;
        } else {
          await this.updatePickerPackerSupervisor(
            pickerId,
            packerId,
            supervisorId,
            zone,
            deliveryDate,
          );
        }
      }
      return true;
    } else {
      return false;
    }
  }

  async updatePickerPackerSupervisor(
    pickerId: number,
    packerId: number,
    supervisorId: number,
    zone: string,
    deliveryDate: Date,
  ) {
    this.logger.log(
      this.asyncContext.get('traceId'),
      `Updating pickers, packers and supervisor for zone : ${zone} of delivery date : ${deliveryDate}`,
    );
    await this.ppdRepository.update(
      { zone: zone, delivery_date: deliveryDate.toISOString().slice(0, 10) },
      {
        picker_user_id: pickerId,
        packer_user_id: packerId,
        supervisor_user_id: supervisorId,
      },
    );
  }

  async getPpdOrders(zone: string, deliveryDate: Date): Promise<PpdEntity[]> {
    this.logger.log(
      this.asyncContext.get('traceId'),
      `Fetching existing orders of zone : ${zone} and delivery date : ${deliveryDate}`,
    );
    const orders: PpdEntity[] = await this.ppdRepository.findBy({
      zone: zone,
      delivery_date: deliveryDate.toISOString().slice(0, 10),
    });
    return orders;
  }

  createPpdOrderBean(
    order: OrderEntity,
    items: OrderItemsEntity[],
    route: number,
    address: object,
    pps: number,
    seq: number,
  ): PpdOrderBean {
    this.logger.log(
      this.asyncContext.get('traceId'),
      `Creating ppd bean for orderId: ${order.id}`,
    );
    const ppdOrderBean = {
      order_id: order.id,
      display_order_id: order.display_order_id,
      sequence_no: seq + 1,
      zone: order.metadata['zoneId'],
      distance: order.metadata['storeDistance'],
      order_items: items,
      status: 'NEW_ORDER',
      metadata: {
        address: {
          addressLine1: address['address_line_1'],
          addressLine2: address['address_line_2'],
          landmark: address['landmark'],
          city: address['city'],
          latitude: address['lat'],
          longitude: address['long'],
          state: address['state'],
          pinCode: address['pinCode'],
          contactNumber: address['contactNumber'],
        },
      },
      route: route,
      pps: pps,
      delivery_date: order.delivery_date.toString(),
      created_on: new Date(Date.now()),
      created_by: '01b6686b-6c23-4614-ad0b-9bd21fd2a146',
      modified_on: new Date(Date.now()),
      modified_by: '01b6686b-6c23-4614-ad0b-9bd21fd2a146',
    } as PpdOrderBean;
    return ppdOrderBean;
  }

  createItemObject(orderItem: OrderItemsEntity): OrderItemsEntity {
    this.logger.log(
      this.asyncContext.get('traceId'),
      `Creating Item object for item Object: ${orderItem.id}`,
    );
    const itemObj = {
      id: orderItem.id,
      skuCode: orderItem.sku_code,
      productName: orderItem.product_name,
      uom: orderItem.uom,
      categoryId: orderItem.category_id,
      categoryName: orderItem.category_name,
      orderedQty: orderItem.ordered_qty,
      finalQty: orderItem.final_quantity,
      salePrice: orderItem.sale_price,
      finalBillAmount: orderItem.final_amount,
      metadata: orderItem.metadata,
      active: 1,
      created_at: new Date(Date.now()),
      created_by: '01b6686b-6c23-4614-ad0b-9bd21fd2a146',
      modified_at: new Date(Date.now()),
      modified_by: '01b6686b-6c23-4614-ad0b-9bd21fd2a146',
    };
    return itemObj;
  }

  async getAddress(addressId: number) {
    this.logger.log(
      this.asyncContext.get('traceId'),
      `fetch address for addressId : ${addressId}`,
    );
    const authURL = `${process.env.UTIL_URL}/auth/internal/addresses/${addressId}`;
    const axiosOptions = {
      url: authURL,
      method: 'GET',
      headers: {
        Authorization: process.env.UTIL_TOKEN, //TODO
      },
    };
    const result = await axios(axiosOptions);
    return result;
  }

  async startPickersPackersSupervisorsAssignment(): Promise<boolean> {
    const deliveryDate = this.orderService.getDeliveryDate();
    const zonesEntities = await this.getPpdZonesDetails(deliveryDate);
    for (const zone of zonesEntities) {
      await this.checkPickerPackerSupervisorAssignment(
        zone.zone,
        new Date(zone.delivery_date),
        zone.pickerId,
        zone.packerId,
        zone.supervisorId,
      );
    }
    return true;
  }

  async getPpdZonesDetails(
    deliveryDate: Date,
  ): Promise<PpdPickersPackersSupervisorsEntity[]> {
    return await this.ppdPickersPackersSupervisorsEntityRepository.find({
      where: {
        delivery_date: deliveryDate.toISOString().slice(0, 10),
        active: 1,
      },
    });
  }

  createRequestData(orderList: OrderEntity[]): RoutingRequest {
    const zoneOrders: ZoneOrder[] = [];
    for (const order of orderList) {
      const zoneOrder: ZoneOrder = {
        zone: order.metadata.zoneId,
        location: {
          lat: parseFloat(order.metadata.location['lat']),
          long: parseFloat(order.metadata.location['long']),
        },
        orderId: order.display_order_id,
      };
      zoneOrders.push(zoneOrder);
    }

    return {
      zoneOrders: zoneOrders,
      origin: { lat: 28.39912, long: 77.04073 },
      riderCapacity: 7,
    };
  }

  async getRoutingMap(
    orderList: OrderEntity[],
  ): Promise<Map<string, RoutingResponse>> {
    const routes = await this.getRouting(orderList);
    if (routes == null) {
      return null;
    }
    const routingMap = new Map<string, RoutingResponse>();
    for (const route of routes) {
      routingMap.set(route.orderId, route);
    }
    return routingMap;
  }

  async getRouting(orderList: OrderEntity[]): Promise<RoutingResponse[]> {
    try {
      const routingRequestData = this.createRequestData(orderList);
      const pyUtilUrl =
        this.configService.get('util_url') + '/pyutil/get-routing';
      const axiosOptions = {
        url: pyUtilUrl,
        method: 'POST',
        headers: {
          Authorization: process.env.UTIL_TOKEN,
        },
        data: routingRequestData,
      };
      const result = await axios(axiosOptions);
      this.logger.log(this.asyncContext.get('traceId'), JSON.stringify(result));
      return result.data;
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong',
        e,
      );
    }
    return null;
  }
}
