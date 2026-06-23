"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { create } from "zustand";
import { useAuthStore } from "@/core/auth/authStore";
import { env } from "@/core/config/env";
import { normalizeSocketIoUrl } from "@/features/ops/api/liveMap.realtime";
import {
  CHAT_SOCKET_EVENT,
  TICKET_SOCKET_EVENT,
  DISPUTE_MESSAGE_EVENT,
  DISPUTE_UPDATED_EVENT,
  parseChatSocketPayload,
  parseTicketSocketPayload,
  parseDisputeSocketMessagePayload,
  parseDisputeSocketUpdatedPayload,
  type ChatSocketMessagePayload,
  type ChatSocketStatus,
  type TicketSocketUpdatedPayload,
  type DisputeSocketMessagePayload,
  type DisputeSocketUpdatedPayload,
} from "../api/chatSocket.realtime";

interface ChatSocketStore {
  connected: boolean;
  status: ChatSocketStatus;
  setConnected: (connected: boolean) => void;
  setStatus: (status: ChatSocketStatus) => void;
}

export const useChatSocketStore = create<ChatSocketStore>((set) => ({
  connected: false,
  status: "idle",
  setConnected: (connected) => set({ connected }),
  setStatus: (status) => set({ status }),
}));

interface UseSupportChatSocketOptions {
  enabled?: boolean;
  onMessage?: (payload: ChatSocketMessagePayload) => void;
  onTicketUpdated?: (payload: TicketSocketUpdatedPayload) => void;
  onDisputeMessage?: (payload: DisputeSocketMessagePayload) => void;
  onDisputeUpdated?: (payload: DisputeSocketUpdatedPayload) => void;
}

function resolveSocketUserId(userId: string | number | undefined): string | null {
  if (userId == null || userId === "") return null;
  return String(userId);
}

export function useSupportChatSocket({
  enabled = true,
  onMessage,
  onTicketUpdated,
  onDisputeMessage,
  onDisputeUpdated,
}: UseSupportChatSocketOptions = {}) {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);
  const setConnected = useChatSocketStore((s) => s.setConnected);
  const globalStatus = useChatSocketStore((s) => s.status);
  const setGlobalStatus = useChatSocketStore((s) => s.setStatus);
  const [status, setStatus] = useState<ChatSocketStatus>(globalStatus);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const onTicketUpdatedRef = useRef(onTicketUpdated);
  onTicketUpdatedRef.current = onTicketUpdated;
  const onDisputeMessageRef = useRef(onDisputeMessage);
  onDisputeMessageRef.current = onDisputeMessage;
  const onDisputeUpdatedRef = useRef(onDisputeUpdated);
  onDisputeUpdatedRef.current = onDisputeUpdated;

  const updateStatus = (next: ChatSocketStatus) => {
    setStatus(next);
    setGlobalStatus(next);
  };

  useEffect(() => {
    const active =
      enabled && env.useRealAuth && Boolean(token) && Boolean(userId);
    if (!active) {
      updateStatus("idle");
      setConnected(false);
      return;
    }

    const joinUserId = resolveSocketUserId(userId);
    if (!joinUserId) {
      updateStatus("idle");
      setConnected(false);
      return;
    }

    const socketUrl = normalizeSocketIoUrl(env.apiUrl.replace(/\/$/, ""));
    const socket: Socket = io(socketUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 45000,
      transports: ["websocket", "polling"],
      auth: { token },
    });

    updateStatus("connecting");

    const onConnect = () => {
      updateStatus("connected");
      setConnected(true);
      socket.emit("join", joinUserId);
    };

    const onDisconnect = () => {
      updateStatus("disconnected");
      setConnected(false);
    };

    const onConnectError = () => {
      updateStatus("error");
      setConnected(false);
    };

    const onJoinDenied = () => {
      updateStatus("error");
      setConnected(false);
    };

    const onChatMessage = (raw: unknown) => {
      const payload = parseChatSocketPayload(raw);
      if (!payload) return;
      onMessageRef.current?.(payload);
    };
    const onTicketUpdatedEvent = (raw: unknown) => {
      const payload = parseTicketSocketPayload(raw);
      if (!payload) return;
      onTicketUpdatedRef.current?.(payload);
    };
    const onDisputeMessageEvent = (raw: unknown) => {
      const payload = parseDisputeSocketMessagePayload(raw);
      if (!payload) return;
      onDisputeMessageRef.current?.(payload);
    };
    const onDisputeUpdatedEvent = (raw: unknown) => {
      const payload = parseDisputeSocketUpdatedPayload(raw);
      if (!payload) return;
      onDisputeUpdatedRef.current?.(payload);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("join_denied", onJoinDenied);
    socket.on(CHAT_SOCKET_EVENT, onChatMessage);
    socket.on(TICKET_SOCKET_EVENT, onTicketUpdatedEvent);
    socket.on(DISPUTE_MESSAGE_EVENT, onDisputeMessageEvent);
    socket.on(DISPUTE_UPDATED_EVENT, onDisputeUpdatedEvent);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("join_denied", onJoinDenied);
      socket.off(CHAT_SOCKET_EVENT, onChatMessage);
      socket.off(TICKET_SOCKET_EVENT, onTicketUpdatedEvent);
      socket.off(DISPUTE_MESSAGE_EVENT, onDisputeMessageEvent);
      socket.off(DISPUTE_UPDATED_EVENT, onDisputeUpdatedEvent);
      socket.disconnect();
      updateStatus("idle");
      setConnected(false);
    };
  }, [enabled, token, userId, setConnected, setGlobalStatus]);

  return { status };
}
