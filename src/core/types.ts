/**
 * Core Types for Agent Scheduler
 */

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ScheduledJob {
  id: string;
  name: string;
  schedule: string;  // Cron expression
  action: () => Promise<void>;
  enabled: boolean;
  lastRun?: number;
  nextRun?: number;
  status: JobStatus;
  intervalId?: NodeJS.Timeout;
}

export interface ScheduleOptions {
  timezone?: string;
  immediate?: boolean;
}
