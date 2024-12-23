export class WinnerInfo {
  constructor(prizeName: string) {
    this.rewardInfo.name = prizeName;
  }

  rewardInfo: RewardInfo = new RewardInfo();
}

export class RewardInfo {
  name: string;
}
