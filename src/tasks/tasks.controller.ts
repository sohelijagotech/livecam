import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { DailyTaskType } from './entities/daily-task-completion.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get('today')
  today(@CurrentUser() user: { userId: string }) {
    return this.tasksService.listToday(user.userId);
  }

  @Post('claim')
  claim(@CurrentUser() user: { userId: string }, @Body() body: { taskType: DailyTaskType }) {
    return this.tasksService.claim(user.userId, body.taskType);
  }
}
