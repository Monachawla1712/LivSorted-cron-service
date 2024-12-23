import { Prize } from './event-conditions';

export class WinnerInfo {
  constructor(prize: Prize) {
    this.rewardInfo.prize = prize;
  }

  rewardInfo: RewardInfo = new RewardInfo();
}

export class RewardInfo {
  prize: Prize;
}
