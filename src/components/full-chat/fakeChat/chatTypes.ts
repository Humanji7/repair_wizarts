export type ChatAuthor = 'client' | 'master' | 'admin';

export interface ChatMessage {
  id: string;
  ts: string;
  author: ChatAuthor;
  text: string;
  files?: string[];
}

export type TimelineKind =
  | 'order_created'
  | 'chat'
  | 'cancel_requested'
  | 'cancel_master_accepted'
  | 'cancel_master_rejected'
  | 'dispute_opened'
  | 'dispute_master_accepted'
  | 'dispute_master_rejected'
  | 'order_completed';

export interface TimelineItemBase {
  ts: string;
  kind: TimelineKind;
}

export interface TimelineChatItem extends TimelineItemBase {
  kind: 'chat';
  msg: ChatMessage;
}

export interface TimelineSimpleItem extends TimelineItemBase {
  kind:
    | 'order_created'
    | 'cancel_requested'
    | 'cancel_master_accepted'
    | 'cancel_master_rejected'
    | 'dispute_opened'
    | 'dispute_master_accepted'
    | 'dispute_master_rejected'
    | 'order_completed';
}

export type TimelineItem = TimelineChatItem | TimelineSimpleItem;

export interface MasterInfo {
  u_photo?: string;
  u_name?: string;
}

export interface GroupedChat {
  chatId: string;
  masterInfo: MasterInfo;
  orders: any[];
}
