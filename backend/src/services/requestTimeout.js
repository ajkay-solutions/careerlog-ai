// Request timeout middleware
const REQUEST_TIMEOUT = process.env.REQUEST_TIMEOUT || 30000; // 30 seconds default

const requestTimeout = (timeout = REQUEST_TIMEOUT) => {
  return (req, res, next) => {
    const timeoutId = setTimeout(() => {
      console.error(`⏱️ Request timeout after ${timeout}ms:`, {
        method: req.method,
        url: req.url,
        path: req.path,
        query: req.query,
        userId: req.user?.id
      });
      
      if (!res.headersSent) {
        res.status(504).json({
          success: false,
          message: 'Request timeout - please try again',
          timeout: timeout
        });
      }
    }, timeout);

    // Clear timeout if response finishes
    res.on('finish', () => {
      clearTimeout(timeoutId);
    });

    // Clear timeout if connection closes
    res.on('close', () => {
      clearTimeout(timeoutId);
    });

    next();
  };
};

module.exports = requestTimeout;