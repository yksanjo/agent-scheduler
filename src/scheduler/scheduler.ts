/**
 * Agent Scheduler - Cron-like scheduling for agent tasks
 */

import { ScheduledJob, JobStatus } from '../core/types';

export class AgentScheduler {
  private jobs: Map<string, ScheduledJob> = new Map();
  private running: boolean = false;

  /**
   * Add a scheduled job
   */
  addJob(
    id: string,
    name: string,
    schedule: string,
    action: () => Promise<void>
  ): ScheduledJob {
    const job: ScheduledJob = {
      id,
      name,
      schedule,
      action,
      enabled: true,
      status: 'pending',
      nextRun: this.calculateNextRun(schedule)
    };

    this.jobs.set(id, job);
    
    if (this.running) {
      this.startJob(job);
    }

    return job;
  }

  /**
   * Remove a job
   */
  removeJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;

    if (job.intervalId) {
      clearInterval(job.intervalId);
    }

    return this.jobs.delete(id);
  }

  /**
   * Start the scheduler
   */
  start(): void {
    this.running = true;

    for (const job of this.jobs.values()) {
      if (job.enabled) {
        this.startJob(job);
      }
    }
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    this.running = false;

    for (const job of this.jobs.values()) {
      if (job.intervalId) {
        clearInterval(job.intervalId);
        job.intervalId = undefined;
      }
    }
  }

  /**
   * Enable a job
   */
  enableJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;

    job.enabled = true;
    
    if (this.running) {
      this.startJob(job);
    }

    return true;
  }

  /**
   * Disable a job
   */
  disableJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;

    job.enabled = false;

    if (job.intervalId) {
      clearInterval(job.intervalId);
      job.intervalId = undefined;
    }

    return true;
  }

  /**
   * Get job by ID
   */
  getJob(id: string): ScheduledJob | undefined {
    return this.jobs.get(id);
  }

  /**
   * Get all jobs
   */
  getAllJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get jobs by status
   */
  getJobsByStatus(status: JobStatus): ScheduledJob[] {
    return this.getAllJobs().filter(j => j.status === status);
  }

  private startJob(job: ScheduledJob): void {
    if (job.intervalId) {
      clearInterval(job.intervalId);
    }

    // Simple interval-based scheduling (in ms)
    const interval = this.parseSchedule(job.schedule);
    
    job.intervalId = setInterval(async () => {
      if (!job.enabled) return;

      job.status = 'running';
      
      try {
        await job.action();
        job.status = 'completed';
        job.lastRun = Date.now();
      } catch (error) {
        job.status = 'failed';
        console.error(`Job ${job.id} failed:`, error);
      }
    }, interval);

    job.nextRun = Date.now() + interval;
  }

  private parseSchedule(schedule: string): number {
    // Simple schedule parsing - convert to milliseconds
    // Support: "1m", "1h", "1d", or just a number
    const match = schedule.match(/^(\d+)(m|h|d)?$/);
    
    if (!match) {
      return 60000; // Default 1 minute
    }

    const value = parseInt(match[1]);
    const unit = match[2] || 'm';

    switch (unit) {
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return value * 60 * 1000;
    }
  }

  private calculateNextRun(schedule: string): number {
    return Date.now() + this.parseSchedule(schedule);
  }
}
