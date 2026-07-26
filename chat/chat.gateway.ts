import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

interface JoinRoomPayload {
  liveSessionId: string;
  userId: string;
  displayName: string;
}

interface ChatMessagePayload {
  liveSessionId: string;
  userId: string;
  displayName: string;
  message: string;
}

// Minimal blocklist for Phase 1 — swap for a proper moderation service/API before production.
// Kept intentionally short; expand via an admin-editable table rather than a hardcoded list.
const BLOCKED_KEYWORDS = ['spamword1', 'spamword2'];

// Basic spam guard: cap messages per user within a rolling window.
const RATE_LIMIT_WINDOW_MS = 10_000;
const RATE_LIMIT_MAX_MESSAGES = 8;

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('ChatGateway');
  // userId -> timestamps of recent messages, for the rate limiter.
  private recentMessageTimestamps = new Map<string, number[]>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: JoinRoomPayload) {
    client.join(payload.liveSessionId);
    this.server.to(payload.liveSessionId).emit('user_joined', {
      userId: payload.userId,
      displayName: payload.displayName,
    });
    return { event: 'joined', room: payload.liveSessionId };
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: { liveSessionId: string }) {
    client.leave(payload.liveSessionId);
    return { event: 'left', room: payload.liveSessionId };
  }

  @SubscribeMessage('send_message')
  handleMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: ChatMessagePayload) {
    if (this.isRateLimited(payload.userId)) {
      client.emit('message_rejected', { reason: 'rate_limited' });
      return;
    }

    const filtered = this.filterMessage(payload.message);
    if (filtered === null) {
      client.emit('message_rejected', { reason: 'blocked_content' });
      return;
    }

    this.server.to(payload.liveSessionId).emit('new_message', {
      userId: payload.userId,
      displayName: payload.displayName,
      message: filtered,
      timestamp: new Date().toISOString(),
    });
  }

  private isRateLimited(userId: string): boolean {
    const now = Date.now();
    const timestamps = (this.recentMessageTimestamps.get(userId) || []).filter(
      (t) => now - t < RATE_LIMIT_WINDOW_MS,
    );
    if (timestamps.length >= RATE_LIMIT_MAX_MESSAGES) {
      this.recentMessageTimestamps.set(userId, timestamps);
      return true;
    }
    timestamps.push(now);
    this.recentMessageTimestamps.set(userId, timestamps);
    return false;
  }

  // Returns the message with blocked words masked, or null if it should be dropped entirely
  // (e.g. a message that's ONLY blocked content). Phase 1: simple substring match, case-insensitive.
  private filterMessage(message: string): string | null {
    if (!message || !message.trim()) return null;
    let result = message;
    for (const word of BLOCKED_KEYWORDS) {
      const re = new RegExp(word, 'gi');
      result = result.replace(re, '*'.repeat(word.length));
    }
    return result;
  }

  // Called by GiftsService when a gift is sent, to broadcast the animation to the room.
  // Also reused as a generic room-broadcast helper by PkBattleService and LiveGuestsService
  // for non-chat events (pk_battle_started, guest_joined, etc) — event name lives in the payload.
  broadcastGift(liveSessionId: string, payload: any) {
    this.server.to(liveSessionId).emit('gift_sent', payload);
  }
}
