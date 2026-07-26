import { DailyTaskType } from './entities/daily-task-completion.entity';

// XP rewards from the blueprint's "Viewer XP" table.
export const DAILY_TASK_XP: Record<DailyTaskType, number> = {
  [DailyTaskType.DAILY_LOGIN]: 10,
  [DailyTaskType.WATCH_LIVE_5MIN]: 5,
  [DailyTaskType.SEND_ANY_GIFT]: 20,
  [DailyTaskType.SHARE_APP]: 15,
};

export const DAILY_TASK_LABELS: Record<DailyTaskType, string> = {
  [DailyTaskType.DAILY_LOGIN]: 'Daily Login',
  [DailyTaskType.WATCH_LIVE_5MIN]: 'Watch a live for 5 minutes',
  [DailyTaskType.SEND_ANY_GIFT]: 'Send a gift',
  [DailyTaskType.SHARE_APP]: 'Share the app',
};
