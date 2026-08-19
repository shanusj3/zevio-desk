/**
 * Background Task Queue Service
 */

export interface QueueJob<T = any> {
  id: string;
  name: string;
  data: T;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  error?: string;
}

const jobQueue: QueueJob[] = [];

export const queue = {
  add: async <T>(name: string, data: T): Promise<QueueJob<T>> => {
    const job: QueueJob<T> = {
      id: `job-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      data,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    jobQueue.push(job);
    
    // Asynchronous background processing simulation
    setTimeout(() => {
      job.status = "completed";
      job.completedAt = new Date().toISOString();
    }, 1500);

    return job;
  },
  getJobs: () => jobQueue,
};
