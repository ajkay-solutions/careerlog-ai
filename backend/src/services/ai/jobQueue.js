const AnalysisService = require('./analysisService');
const { cacheSet, cacheGet } = require('../cache');

class AIJobQueue {
  constructor() {
    this.analysisService = new AnalysisService();
    this.queue = [];
    this.processing = false;
    this.processingInterval = null;
    this.isStarted = false;
  }

  // Ensure queue is started (lazy initialization)
  ensureStarted() {
    if (!this.isStarted) {
      this.startProcessing();
      this.isStarted = true;
    }
  }

  // Add entry analysis job to queue
  async addAnalysisJob(entryId, options = {}) {
    this.ensureStarted(); // Start queue if not already started
    
    const jobId = `analysis_${entryId}_${Date.now()}`;
    
    const job = {
      id: jobId,
      type: 'entry_analysis',
      entryId: entryId,
      status: 'pending',
      createdAt: new Date(),
      options: {
        priority: options.priority || 'normal', // high, normal, low
        retries: options.retries || 2,
        timeout: options.timeout || 60000, // 60 seconds
        ...options
      },
      attempts: 0,
      lastError: null
    };

    // Add to queue (high priority jobs first)
    if (job.options.priority === 'high') {
      this.queue.unshift(job);
    } else {
      this.queue.push(job);
    }

    console.log(`📋 Added AI analysis job ${jobId} to queue (position: ${this.queue.length})`);
    
    // Store job status in cache for tracking
    await cacheSet(`job:${jobId}`, job, 3600); // 1 hour TTL
    
    return jobId;
  }

  // Add batch analysis job
  async addBatchAnalysisJob(entryIds, options = {}) {
    this.ensureStarted(); // Start queue if not already started
    
    const jobId = `batch_analysis_${Date.now()}`;
    
    const job = {
      id: jobId,
      type: 'batch_analysis',
      entryIds: entryIds,
      status: 'pending',
      createdAt: new Date(),
      options: {
        batchSize: options.batchSize || 5,
        priority: options.priority || 'normal',
        retries: options.retries || 1,
        ...options
      },
      attempts: 0,
      progress: { completed: 0, total: entryIds.length },
      lastError: null
    };

    this.queue.push(job);
    
    console.log(`📋 Added batch AI analysis job ${jobId} for ${entryIds.length} entries`);
    await cacheSet(`job:${jobId}`, job, 7200); // 2 hours TTL
    
    return jobId;
  }

  // Start processing queue
  startProcessing() {
    if (this.processingInterval) return;
    
    console.log('🔄 Starting AI job queue processing...');
    
    this.processingInterval = setInterval(async () => {
      if (!this.processing && this.queue.length > 0) {
        await this.processNextJob();
      }
    }, 5000); // Check every 5 seconds
  }

  // Stop processing queue
  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('⏹️ Stopped AI job queue processing');
    }
  }

  // Process next job in queue
  async processNextJob() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const job = this.queue.shift();
    
    try {
      console.log(`⚡ Processing AI job ${job.id} (${job.type})`);
      
      job.status = 'processing';
      job.startedAt = new Date();
      job.attempts++;
      
      // Update job status in cache
      await cacheSet(`job:${job.id}`, job, 3600);
      
      let result;
      
      switch (job.type) {
        case 'entry_analysis':
          result = await this.processEntryAnalysis(job);
          break;
        case 'batch_analysis':
          result = await this.processBatchAnalysis(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }
      
      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;
      
      console.log(`✅ AI job ${job.id} completed successfully`);
      
    } catch (error) {
      console.error(`❌ AI job ${job.id} failed:`, error.message);
      
      job.status = 'failed';
      job.lastError = error.message;
      job.failedAt = new Date();
      
      // Retry logic
      if (job.attempts < job.options.retries) {
        job.status = 'retry';
        setTimeout(() => {
          this.queue.unshift(job); // Add back to front of queue
        }, Math.pow(2, job.attempts) * 1000); // Exponential backoff
        
        console.log(`🔄 Retrying AI job ${job.id} (attempt ${job.attempts + 1}/${job.options.retries})`);
      }
    } finally {
      // Update final job status in cache
      await cacheSet(`job:${job.id}`, job, 3600);
      this.processing = false;
    }
  }

  // Process single entry analysis
  async processEntryAnalysis(job) {
    const result = await this.analysisService.analyzeEntry(job.entryId, job.options);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    return {
      entryId: job.entryId,
      extractedData: result.data,
      usage: result.usage,
      cached: result.cached
    };
  }

  // Process batch analysis
  async processBatchAnalysis(job) {
    const results = [];
    const { entryIds, options } = job;
    const batchSize = options.batchSize || 5;
    
    for (let i = 0; i < entryIds.length; i += batchSize) {
      const batch = entryIds.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(entryId => this.analysisService.analyzeEntry(entryId, options))
      );
      
      results.push(...batchResults);
      
      // Update progress
      job.progress.completed = Math.min(i + batchSize, entryIds.length);
      await cacheSet(`job:${job.id}`, job, 7200);
      
      // Rate limiting: wait between batches
      if (i + batchSize < entryIds.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    return {
      total: entryIds.length,
      successful,
      failed,
      results: results.map(r => ({
        status: r.status,
        value: r.value,
        reason: r.reason?.message
      }))
    };
  }

  // Get job status
  async getJobStatus(jobId) {
    const job = await cacheGet(`job:${jobId}`);
    
    if (!job) {
      return { status: 'not_found' };
    }
    
    return {
      id: job.id,
      type: job.type,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      failedAt: job.failedAt,
      attempts: job.attempts,
      lastError: job.lastError,
      result: job.result
    };
  }

  // Get queue statistics
  getQueueStats() {
    const pending = this.queue.filter(job => job.status === 'pending').length;
    const processing = this.processing ? 1 : 0;
    
    return {
      total: this.queue.length,
      pending,
      processing,
      isActive: !!this.processingInterval
    };
  }

  // Clear completed jobs from queue
  clearCompleted() {
    const before = this.queue.length;
    this.queue = this.queue.filter(job => 
      job.status !== 'completed' && job.status !== 'failed'
    );
    const cleared = before - this.queue.length;
    
    console.log(`🧹 Cleared ${cleared} completed/failed jobs from queue`);
    return cleared;
  }

  // Emergency stop - clear all jobs
  emergencyStop() {
    this.stopProcessing();
    const cleared = this.queue.length;
    this.queue = [];
    this.processing = false;
    
    console.log(`🚨 Emergency stop: cleared ${cleared} jobs from queue`);
    return cleared;
  }
}

// Singleton instance
let queueInstance = null;

function getJobQueue() {
  if (!queueInstance) {
    queueInstance = new AIJobQueue();
  }
  return queueInstance;
}

module.exports = { AIJobQueue, getJobQueue };