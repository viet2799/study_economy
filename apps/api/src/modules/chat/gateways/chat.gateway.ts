import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { Logger, UnauthorizedException, UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

import { CurrentUser } from '../../../common/interfaces/current-user.interface';
import { SendMessageDto } from '../dto/send-message.dto';
import { KeycloakAuthService } from '../../auth/keycloak-auth.service';
import { ChatService } from '../services/chat.service';

interface SocketWithUser extends Socket {
  data: Socket['data'] & {
    user?: CurrentUser;
  };
}

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true
  },
  namespace: '/chat'
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly keycloakAuthService: KeycloakAuthService,
    private readonly chatService: ChatService,
    private readonly configService: ConfigService
  ) {}

  afterInit(): void {
    this.logger.log(
      `Chat gateway ready on topic ${this.configService.getOrThrow<string>('kafkaChatTopic')}`
    );
  }

  async handleConnection(client: SocketWithUser): Promise<void> {
    const token = this.extractToken(client);

    if (!token) {
      client.disconnect();
      throw new UnauthorizedException('Missing socket token');
    }

    client.data.user = await this.keycloakAuthService.verifyToken(token);
  }

  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @SubscribeMessage('room:join')
  async joinRoom(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody('roomId') roomId: string
  ) {
    await client.join(roomId);

    const messages = await this.chatService.getRecentMessages(roomId);
    client.emit('room:history', messages);

    return {
      event: 'room:joined',
      data: { roomId }
    };
  }

  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @SubscribeMessage('room:message')
  async sendMessage(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() dto: SendMessageDto
  ) {
    const user = client.data.user;
    if (!user) {
      throw new UnauthorizedException();
    }

    const message = await this.chatService.createMessage(dto, user);
    this.server.to(dto.roomId).emit('room:message', message);

    return {
      event: 'room:message:ack',
      data: message
    };
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7);
    }

    return null;
  }
}
