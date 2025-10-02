import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ChatbotService } from './chatbot.service';
import { SendMessageDto, StartSessionDto } from './dto/send-message.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatbotController {
  constructor(private readonly chatbot: ChatbotService) {}

  @Get('sessions')
  listSessions(@CurrentUser() user: AuthUser) {
    return this.chatbot.listSessions(user.id);
  }

  @Post('sessions')
  start(@CurrentUser() user: AuthUser, @Body() dto: StartSessionDto) {
    return this.chatbot.start(user.id, dto);
  }

  @Get('sessions/:id')
  history(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.chatbot.history(user.id, id);
  }

  @Post('sessions/:id/messages')
  sendMessage(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatbot.sendMessage(user.id, id, dto);
  }
}
