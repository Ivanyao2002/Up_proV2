"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { create } from "zustand";
import { useAuthStore } from "@/core/auth/authStore";
import { env } from "@/core/config/env";
import { normalizeSocketIoUrl } from "@/features/ops/api/liveMap.realtime";
import {
  CHAT_SOCKET_EVENT,
  parseChatSocketPayload,
  type ChatSocketMessagePayload,
  type ChatSocketStatus,
} from "../api/chatSocket.realtime";

interface ChatSocketStore {
  connected: boolean;
  setConnected: (connected: boolean) => void;
}

export const useChatSocketStore = create<ChatSocketStore>((set) => ({
  connected: false,
  setConnected: (connected) => set({ connected }),
}));

interface UseSupportChatSocketOptions {
  enabled?: boolean;
  onMessage?: (payload: ChatSocketMessagePayload) => void;
}

function resolveSocketUserId(userId: string | number | undefined): string | null {
  if (userId == null || userId === "") return null;
  return String(userId);
}

export function useSupportChatSocket({
  enabled = true,
  onMessage,
}: UseSupportChatSocketOptions = {}) {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);
  const setConnected = useChatSocketStore((s) => s.setConnected);
  const [status, setStatus] = useState<ChatSocketStatus>("idle");
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    const active =
      enabled && env.useRealAuth && Boolean(token) && Boolean(userId);
    if (!active) {
      setStatus("idle");
      setConnected(false);
      return;
    }

    const joinUserId = resolveSocketUserId(userId);
    if (!joinUserId) {
      setStatus("idle");
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

    setStatus("connecting");

    const onConnect = () => {
      setStatus("connected");
      setConnected(true);
      socket.emit("join", joinUserId);
    };

    const onDisconnect = () => {
      setStatus("disconnected");
      setConnected(false);
    };

    const onConnectError = () => {
      setStatus("error");
      setConnected(false);
    };

    const onJoinDenied = () => {
      setStatus("error");
      setConnected(false);
    };

    const onChatMessage = (raw: unknown) => {
      const payload = parseChatSocketPayload(raw);
      if (!payload) return;
      onMessageRef.current?.(payload);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("join_denied", onJoinDenied);
    socket.on(CHAT_SOCKET_EVENT, onChatMessage);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("join_denied", onJoinDenied);
      socket.off(CHAT_SOCKET_EVENT, onChatMessage);
      socket.disconnect();
      setStatus("idle");
      setConnected(false);
    };
  }, [enabled, token, userId, setConnected]);

  return { status };
}
