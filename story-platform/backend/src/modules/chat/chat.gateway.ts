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
import { Logger, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly userSocketMap = new Map<string, string>(); // userId -> socketId
  private readonly supabase;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || process.env.SUPABASE_URL;
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY') || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be configured');
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');

      console.log('[SOCKET AUTH] handshake auth exists:', !!client.handshake.auth);
      console.log('[SOCKET AUTH] token exists:', !!token);
      console.log('[SOCKET AUTH] token length:', token ? token.length : 0);

      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      // Validate with Supabase (same as REST API)
      const { data, error } = await this.supabase.auth.getUser(token);

      if (error || !data.user) {
        console.error('[SOCKET AUTH] Supabase validation failed:', error?.message);
        this.logger.warn(`Connection rejected: Invalid token`);
        client.disconnect();
        return;
      }

      const userId = data.user.id;

      console.log('[SOCKET AUTH] authenticated userId:', userId);

      if (!userId) {
        this.logger.warn(`Connection rejected: Invalid token`);
        client.disconnect();
        return;
      }

      // Store the mapping
      this.userSocketMap.set(userId, client.id);
      client.data.userId = userId;

      console.log('[SOCKET] userSocketMap set:', userId, '->', client.id);
      console.log('[SOCKET] userSocketMap size:', this.userSocketMap.size);

      this.logger.log(`User ${userId} connected with socket ${client.id}`);

      // Join user's personal room
      await client.join(`user:${userId}`);
      console.log('[SOCKET] User joined room:', `user:${userId}`);

      // Send connection success
      client.emit('connected', { userId, socketId: client.id });
    } catch (error) {
      this.logger.error(`Connection error: ${error instanceof Error ? error.message : String(error)}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.userSocketMap.delete(userId);
      this.logger.log(`User ${userId} disconnected`);
    }
  }

  @SubscribeMessage('join-conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    try {
      // Verify user has access to this conversation
      const conversation = await this.prisma.supportConversation.findUnique({
        where: { id: data.conversationId },
      });

      if (!conversation || conversation.userId !== userId) {
        client.emit('error', { message: 'Unauthorized' });
        return;
      }

      // Join conversation room
      await client.join(`conversation:${data.conversationId}`);
      this.logger.log(`User ${userId} joined conversation ${data.conversationId}`);
    } catch (error) {
      this.logger.error(`Error joining conversation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  @SubscribeMessage('leave-conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    await client.leave(`conversation:${data.conversationId}`);
    this.logger.log(`User left conversation ${data.conversationId}`);
  }

  // Method to send message to specific user
  async sendToUser(userId: string, event: string, data: any) {
    const socketId = this.userSocketMap.get(userId);
    console.log('[SOCKET] sendToUser - userId:', userId);
    console.log('[SOCKET] sendToUser - socketId from map:', socketId);
    console.log('[SOCKET] sendToUser - event:', event);

    if (socketId) {
      console.log('[SOCKET] sendToUser - emitting to socketId:', socketId);
      this.server.to(socketId).emit(event, data);
    } else {
      // If user is not connected, try to emit to their room
      console.log('[SOCKET] sendToUser - socketId not found, emitting to room:', `user:${userId}`);
      this.server.to(`user:${userId}`).emit(event, data);
    }
  }

  // Method to send message to conversation room
  async sendToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }

  // Method to broadcast to all connected users
  async broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }
}
