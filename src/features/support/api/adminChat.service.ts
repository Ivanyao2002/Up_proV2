import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type {
  ApiChatConversationsResponse,
  ApiChatMessagesResponse,
} from "./adminChat.api.types";
import {
  extractConversations,
  extractMessages,
  mapApiConversationToAdminChat,
  mapChatDetail,
  mapConversationsToPaginated,
} from "./adminChat.mapper";
import type {
  AdminSupportAttachment,
  AdminSupportChat,
  AdminSupportChatDetail,
  AdminSupportMessage,
} from "./adminChat.types";

const LEGACY_LIST = "/admin/support/chat";

function findChatInList(
  chats: AdminSupportChat[],
  chatId: string
): AdminSupportChat | undefined {
  return chats.find((c) => String(c.id) === String(chatId));
}

export const adminChatService = {
  listChats: async (params?: ListParams): Promise<Paginated<AdminSupportChat>> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<Paginated<AdminSupportChat>>(
        `${LEGACY_LIST}${buildListQuery(params)}`
      );
    }

    const response = await apiClient.get<ApiChatConversationsResponse>(
      `${LINKS.admin.v1.chatConversations}${buildV1ListQuery({
        ...params,
        type: params?.type ?? "franchise",
      })}`
    );

    return mapConversationsToPaginated(response, params);
  },

  getChat: async (chatId: string): Promise<AdminSupportChatDetail> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<AdminSupportChatDetail>(`${LEGACY_LIST}/${chatId}`);
    }

    const [listResponse, messagesResponse] = await Promise.all([
      apiClient.get<ApiChatConversationsResponse>(
        `${LINKS.admin.v1.chatConversations}${buildV1ListQuery({
          type: "franchise",
          per_page: 100,
        })}`
      ),
      apiClient.get<ApiChatMessagesResponse>(
        LINKS.admin.v1.chatMessages(chatId)
      ),
    ]);

    const conversations = extractConversations(listResponse).map(
      mapApiConversationToAdminChat
    );
    const chat =
      findChatInList(conversations, chatId) ??
      mapApiConversationToAdminChat({
        id: chatId,
        participant_name: "Franchise",
      });

    return mapChatDetail(chat, extractMessages(messagesResponse));
  },

  replyChat: (chatId: string, body: string, attachmentId?: string) => {
    const payload = attachmentId ? { body, attachment_id: attachmentId } : { body };
    if (useLegacyAdminApi()) {
      return apiClient.post<AdminSupportMessage>(`${LEGACY_LIST}/${chatId}/messages`, payload);
    }
    return apiClient.post<AdminSupportMessage>(
      LINKS.admin.v1.chatMessages(chatId),
      { ...payload, content: body, text: body }
    );
  },

  closeChat: (chatId: string): Promise<{ ok: true }> => {
    if (useLegacyAdminApi()) {
      return apiClient.patch(`${LEGACY_LIST}/${chatId}/close`, {});
    }
    return apiClient.patch(LINKS.support.chat.close(chatId), {});
  },

  uploadAttachment: async (chatId: string, file: File): Promise<AdminSupportAttachment> => {
    const form = new FormData();
    form.append("file", file);
    if (useLegacyAdminApi()) {
      return apiClient.post(`${LEGACY_LIST}/${chatId}/attachments`, form);
    }
    return apiClient.post(LINKS.support.chat.attachments(chatId), form);
  },
};
