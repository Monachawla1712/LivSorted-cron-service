import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrderService } from '../order/order.service';
import { WalletService } from '../wallet/wallet.service';
import { WalletEntity } from '../wallet/wallet.entity';
import { OrderEntity } from '../order/order.entity';
import { FailedOrderEntity } from '../failed-order/failed-order.entity';
import { processBatchReturnObject } from './classes/process-batch-return-object';
import { OrderParamsService } from '../order-params/order-params.service';
import { InventoryService } from '../store/inventory.service';
import { FailedOrderService } from '../failed-order/failed-order.service';
import * as bd from 'bigdecimal.js';
import { OrderItemsEntity } from '../order/order-items.entity';
import { PpdService } from '../ppd/ppd.service';
import { ClevertapPushbean } from '../order/classes/clevertap-push.bean';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { CronParams } from './classes/cron-params';
import { NotificationService } from '../core/notification/notification.service';
import { CustomLogger } from '../core/custom-logger';
import { AsyncContext } from '@nestjs-steroids/async-context';

const VOUCHER_CODE_SKU_MAPPING = {
  FREESRT: [
    ['ST3091', 0.05],
    ['ST3092', 0.025],
  ],
};

@Injectable()
export class CronService {
  private readonly logger = new CustomLogger(CronService.name);
  private clevertapPushbean: ClevertapPushbean = new ClevertapPushbean();
  constructor(
    private readonly asyncContext: AsyncContext<string, string>,
    private orderService: OrderService,
    private walletService: WalletService,
    private orderParamsService: OrderParamsService,
    private inventoryService: InventoryService,
    private failedOrderService: FailedOrderService,
    private dataSource: DataSource,
    private ppdService: PpdService,
    private configService: ConfigService,
    private notificationService: NotificationService,
  ) {}

  async start12amCron() {
    this.clevertapPushbean = new ClevertapPushbean();
    const cartsList = await this.orderService.getAllCarts();
    const userIdList = this.orderService.extractUserIdsFromCarts(cartsList);
    const userWallets = await this.walletService.getAllUserWallets(userIdList);
    const userIdWalletMap = this.getUserIdWalletMap(userWallets);
    const cronParams = await this.getCronParams();
    await this.batchProcessing(cartsList, userIdWalletMap, cronParams);
    await this.sendClevertapEvent();
    delete this.clevertapPushbean;
    return true;
  }

  private async getCronParams(): Promise<CronParams> {
    const cronParams = new CronParams();
    cronParams.batchSize = await this.orderParamsService.getNumberParamValue(
      'BATCH_SIZE',
      10,
    );
    cronParams.processingCap =
      await this.orderParamsService.getNumberParamValue(
        'BATCH_PROCESSING_CAPACITY',
        10,
      );
    cronParams.walletDifferenceParam =
      await this.orderParamsService.getNumberParamValue('WALLET_DIFFERENCE', 1);
    return cronParams;
  }

  private getUserIdWalletMap(
    userWallets: WalletEntity[],
  ): Map<string, WalletEntity> {
    const userIdWalletMap: Map<string, WalletEntity> = new Map<
      string,
      WalletEntity
    >();
    userWallets.forEach((userWallet) => {
      userIdWalletMap.set(userWallet.entity_id, userWallet);
    });
    return userIdWalletMap;
  }

  private async batchProcessing(
    cartsList: OrderEntity[],
    userIdWalletMap: Map<string, WalletEntity>,
    cronParams: CronParams,
  ) {
    const totalBatches = Math.ceil(cartsList.length / cronParams.batchSize);

    const promiseArray: Promise<processBatchReturnObject>[] = [];
    const failedBatches: processBatchReturnObject[] = [];

    for (let batchNumber = 0; batchNumber < totalBatches; batchNumber++) {
      const start = batchNumber * cronParams.batchSize;
      const end = Math.min(start + cronParams.batchSize, cartsList.length);

      promiseArray.push(
        this.processBatch(cartsList, userIdWalletMap, start, end, cronParams),
      );

      if (promiseArray.length == cronParams.processingCap) {
        this.logger.log(
          this.asyncContext.get('traceId'),
          '---> parallel processing of carts starting <---',
        );
        const res = await Promise.all(promiseArray);
        promiseArray.splice(0, promiseArray.length);

        for (const a of res) {
          if (a.success == false) {
            failedBatches.push(a);
          }
        }
      }
    }

    if (promiseArray.length > 0) {
      const res = await Promise.all(promiseArray);
      promiseArray.splice(0, promiseArray.length);

      for (const a of res) {
        if (a.success == false) {
          failedBatches.push(a);
        }
      }
    }

    await this.processFailedOrders(
      cartsList,
      userIdWalletMap,
      failedBatches,
      cronParams,
    );

    this.logger.log(
      this.asyncContext.get('traceId'),
      '\n-------------------- 12AM Cron FINISHED  ---------------------\n',
    );

    await this.ppdService.startPpdCron();
  }

  private async processBatch(
    cartsList: OrderEntity[],
    userIdWalletMap: Map<string, WalletEntity>,
    start: number,
    end: number,
    cronParams: CronParams,
  ): Promise<processBatchReturnObject> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    this.logger.log(
      this.asyncContext.get('traceId'),
      'Processing batch from index : ' + start + ' to :' + end,
    );

    try {
      for (let i = start; i < end; i++) {
        if (i < cartsList.length) {
          let cart = cartsList.at(i);
          let userWallet = userIdWalletMap.get(cart.customer_id);
          if (await this.isCartReadyForOrder(cart, userWallet, cronParams)) {
            const cartFinalBillAmount = new bd.Big(cart.final_bill_amount);
            const walletAmount = new bd.Big(userWallet.amount);
            userWallet.amount = walletAmount
              .subtract(cartFinalBillAmount)
              .toString();
            userWallet = await queryRunner.manager.save(userWallet);

            let walletStatement =
              this.walletService.createWalletStatementEntity(
                cart,
                'DEBIT',
                'Order',
                userWallet.amount,
                'USER',
              );
            walletStatement = await queryRunner.manager.save(walletStatement);
            if (
              (await this.orderService.getOrdersCount(cart.customer_id)) == 0
            ) {
              const orderItem = await this.createOrderItemEntity(
                cart.id,
                'T201',
                1,
              );
              const aa = await queryRunner.manager.save(orderItem);
              cart.item_count = cart.item_count + 1;
              this.logger.log(
                this.asyncContext.get('traceId'),
                '\n\n----- gift item added to order' + cart + '-----\n\n',
              );
            }

            if (cart.offer_data != null) {
              if (
                cart.offer_data.voucherCode != null &&
                cart.offer_data.isOfferApplied != null &&
                cart.offer_data.isOfferApplied == true
              ) {
                if (cart.offer_data.voucherCode in VOUCHER_CODE_SKU_MAPPING) {
                  const offerItemsList =
                    VOUCHER_CODE_SKU_MAPPING[cart.offer_data.voucherCode];

                  for (const oi of offerItemsList) {
                    const skuCode = oi[0];
                    const quantity = oi[1];
                    const item = await this.createOrderItemEntity(
                      cart.id,
                      skuCode,
                      quantity,
                    );
                    if (item != null) {
                      const orderItemsEntity = new OrderItemsEntity();
                      Object.assign(orderItemsEntity, item);
                      await queryRunner.manager.save(orderItemsEntity);
                      cart.item_count = cart.item_count + 1;
                    }
                  }
                }
              }
            }
            this.cartToNewOrder(cart);
            cart = await queryRunner.manager.save(cart);
          } else {
            cart.status = 10;
            const failureReason = [];
            if (cart.delivery_address == null) {
              failureReason.push('Address not added in cart');
            }
            if (userWallet == null) {
              failureReason.push('Insufficient wallet balance');
            } else {
              const a = new bd.Big(cart.final_bill_amount);
              const b = new bd.Big(userWallet.amount);
              if (a.compareTo(b) === 1) {
                failureReason.push('Insufficient wallet balance');
              }
            }
            cart.metadata.failureReason = failureReason;
            cart = await queryRunner.manager.save(cart);
          }
        }
      }
      await queryRunner.commitTransaction();
      try {
        for (let i = start; i < end; i++) {
          if (i < cartsList.length) {
            const cart = cartsList.at(i);
            if (cart.status != 10) {
              const evtNameData = {
                SkuIds: (await this.orderService.getOrderItems(cart.id))
                  .map((item) => {
                    return item.sku_code;
                  })
                  .join(','),
                OrderCount: await this.orderService.getOrdersCount(
                  cart.customer_id,
                ),
              };
              this.logger.log(
                this.asyncContext.get('traceId'),
                '\n\n-------------------- CLEVERTAP FILLING OBJECTS  ---------------------\n\n',
              );
              this.clevertapPushbean.d.push({
                identity: '+91' + (await this.getPhoneNumber(cart.customer_id)),
                ts: Math.floor(new Date().getTime() / 1000) + 19800,
                type: 'event',
                evtName: 'Order Placed',
                evtData: evtNameData,
              });
            }
          }
        }
      } catch (e) {
        this.logger.error(
          this.asyncContext.get('traceId'),
          'Something went wrong',
          e,
        );
      }
    } catch (e) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        this.asyncContext.get('traceId'),
        '\nBatch failed from index : ' + start + ' to :' + end,
        e,
      );
      return { success: false, start: start, end: end };
    } finally {
      this.logger.log(
        this.asyncContext.get('traceId'),
        '\nBatch processed from index : ' + start + ' to :' + end,
      );
      await queryRunner.release();
    }
    return { success: true, start: start, end: end };
  }

  private async processFailedOrders(
    cartsList: OrderEntity[],
    userIdWalletMap: Map<string, WalletEntity>,
    failedBatches: processBatchReturnObject[],
    cronParams: CronParams,
  ) {
    this.logger.log(
      this.asyncContext.get('traceId'),
      '\n---> Processing failed orders\n',
    );
    for (const failedBatch of failedBatches) {
      for (let i = failedBatch.start; i < failedBatch.end; i++) {
        if (
          !(await this.processSingleOrder(
            cartsList.at(i),
            userIdWalletMap,
            cronParams,
          ))
        ) {
          this.logger.log(
            this.asyncContext.get('traceId'),
            '\n------------ ALERT : THIS ORDER COULD NOT BE PROCESSED -------\n' +
              cartsList.at(i),
          );
          //Send Alert Notification
        }
      }
    }
  }

  private async processSingleOrder(
    cart: OrderEntity,
    userIdWalletMap: Map<string, WalletEntity>,
    cronParams: CronParams,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let userWallet = userIdWalletMap.get(cart.customer_id);
      if (await this.isCartReadyForOrder(cart, userWallet, cronParams)) {
        const cartFinalBillAmount = new bd.Big(cart.final_bill_amount);
        const walletAmount = new bd.Big(userWallet.amount);
        userWallet.amount = walletAmount
          .subtract(cartFinalBillAmount)
          .toString();
        userWallet = await queryRunner.manager.save(userWallet);
        let walletStatement = this.walletService.createWalletStatementEntity(
          cart,
          'DEBIT',
          'Order',
          userWallet.amount,
          'USER',
        );
        walletStatement = await queryRunner.manager.save(walletStatement);

        if ((await this.orderService.getOrdersCount(cart.customer_id)) == 0) {
          const orderItem = await this.createOrderItemEntity(
            cart.id,
            'T201',
            1,
          );
          await queryRunner.manager.save(orderItem);
          cart.item_count = cart.item_count + 1;
          this.logger.log(
            this.asyncContext.get('traceId'),
            '\n\n----- gift item added to order' + cart + '-----\n\n',
          );
        }

        if (cart.offer_data != null) {
          if (
            cart.offer_data.voucherCode != null &&
            cart.offer_data.isOfferApplied != null &&
            cart.offer_data.isOfferApplied == true
          ) {
            if (cart.offer_data.voucherCode in VOUCHER_CODE_SKU_MAPPING) {
              const offerItemsList =
                VOUCHER_CODE_SKU_MAPPING[cart.offer_data.voucherCode];

              for (const oi of offerItemsList) {
                const skuCode = oi[0];
                const quantity = oi[1];
                const orderItemEntity = await this.createOrderItemEntity(
                  cart.id,
                  skuCode,
                  quantity,
                );
                if (orderItemEntity != null) {
                  await queryRunner.manager.save(orderItemEntity);
                  cart.item_count = cart.item_count + 1;
                }
              }
            }
          }
        }
        this.cartToNewOrder(cart);
        await queryRunner.manager.save(cart);
      } else {
        cart.status = 10;
        cart = await queryRunner.manager.save(cart);
        const failedOrderBean = {
          order_id: cart.id,
          active: 1,
          created_by: cart.created_by,
          modified_by: cart.modified_by,
        };
        const failedOrderEntity = new FailedOrderEntity();
        Object.assign(failedOrderEntity, failedOrderBean);
        await queryRunner.manager.save(failedOrderEntity);
      }
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      return false;
    } finally {
      await queryRunner.release();
    }
    return true;
  }

  private async isCartReadyForOrder(
    cart: OrderEntity,
    userWallet: WalletEntity,
    cronParams: CronParams,
  ) {
    if (cart.delivery_address == null || userWallet == null) {
      return false;
    }

    const cartFinalAmount = new bd.Big(cart.final_bill_amount);
    if (cartFinalAmount.compareTo(new bd.Big('0')) == 0) {
      return true;
    }

    const walletAmount = new bd.Big(userWallet.amount);
    const walletDiffParam = new bd.Big(cronParams.walletDifferenceParam);
    const multipliedWalletAmount = walletAmount.multiply(walletDiffParam);

    if (cartFinalAmount.compareTo(multipliedWalletAmount) <= 0) {
      //finalAmount<=multipliedWalletAmount
      return true;
    }

    if (cartFinalAmount.compareTo(walletAmount) === 1) {
      //cart.final>userWallet.amount
      return false;
    }
    return true;
  }

  private async releaseItemsInCart(cart: OrderEntity) {
    const items = await this.orderService.getOrderItems(cart.id);
    for (const item of items) {
      await this.inventoryService.releaseInventory(
        cart.store_id,
        item.sku_code,
        item.final_quantity,
      );
    }
    return;
  }

  async createOrderItemEntity(
    orderId,
    skuCode: string,
    quantity: number,
  ): Promise<OrderItemsEntity> {
    try {
      const productData =
        await this.inventoryService.getProductDetailsFromSkuCode(skuCode);
      if (productData != null) {
        const orderItemEntity = this.orderService.createNewOrderItemEntity(
          productData,
          orderId,
          quantity.toString(),
        );
        return orderItemEntity;
      }
      return null;
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong',
        e,
      );
      return null;
    }
  }

  async getPhoneNumber(customerId: string) {
    try {
      this.logger.log(
        this.asyncContext.get('traceId'),
        `fetch address for customerId : ${customerId}`,
      );
      const authURL =
        this.configService.get('util_url') +
        `/auth/internal/user/${customerId}`;
      const axiosOptions = {
        url: authURL,
        method: 'GET',
        headers: {
          Authorization: this.configService.get('util_token'), //TODO
        },
      };
      const result = await axios(axiosOptions);
      return result.data['phone_number'];
    } catch (e) {
      this.logger.error(
        this.asyncContext.get('traceId'),
        'Something went wrong',
        e,
      );
    }
  }
  async sendClevertapEvent() {
    return await this.notificationService.sendCleverTapNotification(
      this.clevertapPushbean,
    );
  }

  private cartToNewOrder(cart: OrderEntity) {
    cart.status = 1;
    cart.payment_detail.paymentStatus = 'SUCCESS';
    cart.amount_received = cart.final_bill_amount;
    cart.shipping_method = 1;
    cart.payment_method = '2';
    cart.lithos_synced = 1;
    cart.submitted_at = new Date(Date.now());
  }
}
