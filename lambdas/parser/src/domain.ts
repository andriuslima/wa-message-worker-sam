export interface IntegrationEvent {
  phone: string;
  instance: string;
  messages: MessageValue[];
}

export interface Message {
  key: string;
  instance: string;
  msgs: MessageValue[];
}

export interface MessageValue {
  value: string;
  index: number;
  delay: number;
}
