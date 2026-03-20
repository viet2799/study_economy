import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import { CurrentUser } from '../../common/interfaces/current-user.interface';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatService } from './services/chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms/:roomId/messages')
  getMessages(@Param('roomId') roomId: string) {
    return this.chatService.getRecentMessages(roomId);
  }

  @Post('messages')
  sendMessage(
    @Body() dto: SendMessageDto,
    @CurrentUserDecorator() user: CurrentUser
  ) {
    return this.chatService.createMessage(dto, user);
  }
}
