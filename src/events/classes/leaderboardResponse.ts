import { StoreEntity } from '../../store/store.entity';
import { Prize } from './event-conditions';

export class LeaderboardResponse {
  leaderboard: StoreLeaderboardDetails[] = [];
  myRank: number = null;
  bannerImageUrl: string = null;
  bannerLink: string = null;
  nextTierMessage: string = null;
  eventStatusMessage: string = null;
  eventStatusIconImageUrl: string = null;
}

export class StoreLeaderboardDetails {
  constructor(store: StoreEntity, prize: Prize, amount: number) {
    this.storeId = store.store_id;
    this.storeName = store.name;
    this.prize = prize;
    this.amount = amount.toFixed(0);
  }
  storeId: string;
  storeName: string;
  amount: string;
  prize: Prize;
}
