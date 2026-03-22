import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthenticatedUser } from '../../common/decorators/authenticated-user.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { CurrentUser } from '../../common/interfaces/current-user.interface';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatService } from './services/chat.service';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms/:roomId/messages')
  @ResponseMessage('Recent messages fetched successfully')
  getMessages(@Param('roomId') roomId: string) {
    return this.chatService.getRecentMessages(roomId);
  }

  @Post('messages')
  @ResponseMessage('Message created successfully')
  sendMessage(
    @Body() dto: SendMessageDto,
    @AuthenticatedUser() user: CurrentUser
  ) {
    return this.chatService.createMessage(dto, user);
  }
}
