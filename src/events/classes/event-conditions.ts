import { RuleProperties } from 'json-rules-engine';

export class EventRules {
  winner: WinnerRules;
  reward: Reward;
  eventDetails: EventDetails;
}

export class WinnerRules {
  selectionType: string;
  meritOrder: string[];
  conditions: RuleProperties;
  selectionNumber: number;
}
export class Reward {
  conditional: Prize[];
  merit: Prize[];
  random: Prize[];
}

export class Prize {
  name: string;
  imgUrl: string;
}

export class EventDetails {
  bannerImageUrl: string;
  bannerLink: string;
  eventSuccessTrigger: EventStatusTrigger;
  eventFailureTrigger: EventStatusTrigger;
}

export class EventStatusTrigger {
  message: string;
  icon: string;
}
