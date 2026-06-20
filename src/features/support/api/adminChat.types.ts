export interface AdminSupportAttachment {
  id: string;
  url: string;
  type: "image" | "pdf" | "document";
  filename: string;
  size_bytes?: number;
}

export interface AdminSupportMessage {
  id: string;
  author: string;
  role: "reporter" | "agent" | "system";
  body: string;
  at: string;
  attachment?: AdminSupportAttachment;
}

export interface AdminSupportChat {
  id: string;
  participant_name: string;
  franchise_id?: string | null;
  franchise_city?: string | null;
  subject?: string;
  last_message_preview: string;
  unread_count: number;
  status: "open" | "closed";
  updated_at: string;
}

export interface AdminSupportChatDetail extends AdminSupportChat {
  messages: AdminSupportMessage[];
}
