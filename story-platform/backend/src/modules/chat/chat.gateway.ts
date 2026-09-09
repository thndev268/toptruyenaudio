import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

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

      const decoded = this.jwtService.verify(token);
      const userId = decoded.sub;

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
