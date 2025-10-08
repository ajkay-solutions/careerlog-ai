// Database connection semaphore to limit concurrent queries
class DatabaseSemaphore {
  constructor(maxConcurrent = 5) {
    this.maxConcurrent = maxConcurrent;
    this.running = 0;
    this.queue = [];
  }

  async acquire(operation) {
    return new Promise((resolve, reject) => {
      const task = { operation, resolve, reject };
      
      if (this.running < this.maxConcurrent) {
        this.execute(task);
      } else {
        this.queue.push(task);
      }
    });
  }

  async execute(task) {
    this.running++;
    
    try {
      const result = await task.operation();
      task.resolve(result);
    } catch (error) {
      task.reject(error);
    } finally {
      this.running--;
      
      if (this.queue.length > 0) {
        const nextTask = this.queue.shift();
        this.execute(nextTask);
      }
    }
  }

  getStatus() {
    return {
      running: this.running,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent
    };
  }
}

// Create a global semaphore instance
const dbSemaphore = new DatabaseSemaphore(3); // Limit to 3 concurrent database operations

module.exports = { dbSemaphore };