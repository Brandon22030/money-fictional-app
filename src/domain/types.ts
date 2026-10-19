export type IntentionKind = 'receive' | 'send' | 'pay' | 'withdraw';

export type Transaction = {
  id: string;
  kind: IntentionKind;
  labelKey: string;
  labelParams?: Record<string, string>;
  amountMinor: number;
  createdAt: string;
};
