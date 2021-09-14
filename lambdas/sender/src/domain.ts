export interface IntegrationEvent {
  phone: string;
  messages: MessageValue[];
}

export interface MessageValue {
  value: string;
  index: number;
  delay: number;
}

export function compareMsgs(a: MessageValue, b: MessageValue): number {
  if (a.index > b.index) return 1;
  if (a.index < b.index) return -1;

  return 0;
}
