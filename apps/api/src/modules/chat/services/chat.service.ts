import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatMessage } from '@prisma/client';

import { CurrentUser } from '../../../common/interfaces/current-user.interface';
import { KafkaService } from '../../kafka/kafka.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/services/redis.service';
import { SendMessageDto } from '../dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
    private readonly kafkaService: KafkaService,
    private readonly configService: ConfigService
  ) {}

  async createMessage(
    dto: SendMessageDto,
    user: CurrentUser
  ): Promise<ChatMessage> {
    const chatMessage = await this.prismaService.chatMessage.create({
      data: {
        roomId: dto.roomId,
        message: dto.message,
        userId: user.sub,
        username: user.preferred_username ?? user.email ?? user.sub
      }
    });

    const roomKey = this.getRoomKey(dto.roomId);
    await this.redisService.instance.lpush(roomKey, JSON.stringify(chatMessage));
    await this.redisService.instance.ltrim(roomKey, 0, 49);

    await this.kafkaService.emit(
      this.configService.getOrThrow<string>('kafkaChatTopic'),
      {
        type: 'chat.message.created',
        payload: chatMessage
      }
    );

    return chatMessage;
  }

  async getRecentMessages(roomId: string): Promise<ChatMessage[]> {
    const roomKey = this.getRoomKey(roomId);
    const cachedItems = await this.redisService.instance.lrange(roomKey, 0, 19);

    if (cachedItems.length > 0) {
      return cachedItems
        .map((item) => JSON.parse(item) as ChatMessage)
        .reverse();
    }

    const messages = await this.prismaService.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return messages.reverse();
  }

  private getRoomKey(roomId: string): string {
    return `chat:room:${roomId}:messages`;
  }
}
