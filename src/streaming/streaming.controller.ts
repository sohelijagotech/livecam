import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { StreamingService } from './streaming.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('streaming')
@UseGuards(JwtAuthGuard)
export class StreamingController {
  constructor(private streamingService: StreamingService) {}

  // Viewers call this with the channelName returned by GET /live/list or /live/:id
  @Post('join-token')
  joinToken(@Body() body: { channelName: string }) {
    return this.streamingService.generateRtcToken(body.channelName, 'audience');
  }
}
