export interface Message {
  key: string;
  msgs: MessageValue[];
}

export interface MessageValue {
  value: string;
  index: number;
}
