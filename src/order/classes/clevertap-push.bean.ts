export class ClevertapPushbean {
  d: ClevertapOrderEventData[] = [];
}

export class ClevertapOrderEventData {
  evtData: any;

  identity: string;

  ts: number;

  type: string;

  evtName: string;
}
