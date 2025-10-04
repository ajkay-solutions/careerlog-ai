const Anthropic = require('@anthropic-ai/sdk');
const PromptTemplates = require('./prompts');

class ClaudeService {
  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      // Ensure no custom headers that might cause issues
      defaultHeaders: {}
    });
    
    // Default model configuration
    this.defaultModel = 'claude-3-haiku-20240307'; // Fast and cost-effective for analysis
    this.maxTokens = 4000;
    this.temperature = 0.1; // Low temperature for consistent extraction
  }

  // Analyze a journal entry and extract structured data
  async analyzeEntry(entryText, userContext = {}) {
    try {
      console.log('🤖 Starting AI analysis for entry...');
      
      if (!entryText || entryText.trim().length < 10) {
        throw new Error('Entry text is too short for meaningful analysis');
      }

      const prompt = PromptTemplates.getAnalysisPrompt(entryText, userContext);
      
      const response = await this.client.messages.create({
        model: this.defaultModel,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0].text;
      
      // Parse JSON response
      let analysisResult;
      try {
        analysisResult = JSON.parse(content);
      } catch (parseError) {
        console.error('❌ Failed to parse AI response as JSON:', parseError);
        console.log('Raw response:', content);
        throw new Error('AI returned invalid JSON response');
      }

      // Validate and clean the response
      const cleanedResult = this.validateAndCleanAnalysisResult(analysisResult);
      
      console.log('✅ AI analysis completed successfully');
      return {
        success: true,
        data: cleanedResult,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens
        }
      };

    } catch (error) {
      console.error('❌ AI analysis failed:', error.message);
      
      // Sanitize error message to prevent API key exposure
      let sanitizedError = error.message;
      if (sanitizedError && typeof sanitizedError === 'string') {
        // Remove any potential API key or sensitive information
        sanitizedError = sanitizedError.replace(/sk-ant-[a-zA-Z0-9\-_]+/g, '[API_KEY_REDACTED]');
        sanitizedError = sanitizedError.replace(/worklog-ai\s+sk-ant-[a-zA-Z0-9\-_]+/g, '[INVALID_HEADER_REDACTED]');
      }
      
      return {
        success: false,
        error: sanitizedError || 'AI analysis failed',
        fallback: this.generateFallbackAnalysis(entryText)
      };
    }
  }

  // Generate insights summary from multiple entries
  async generateInsights(entries, timeframe) {
    try {
      console.log(`🤖 Generating insights for ${entries.length} entries (${timeframe})...`);
      
      if (!entries || entries.length === 0) {
        throw new Error('No entries provided for insight generation');
      }

      const prompt = PromptTemplates.getInsightSummaryPrompt(entries, timeframe);
      
      const response = await this.client.messages.create({
        model: 'claude-3-sonnet-20240229', // More capable model for complex analysis
        max_tokens: 6000,
        temperature: 0.2,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0].text;
      const insights = JSON.parse(content);
      
      console.log('✅ Insights generation completed successfully');
      return {
        success: true,
        data: insights,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens
        }
      };

    } catch (error) {
      console.error('❌ Insights generation failed:', error.message);
      
      // Sanitize error message to prevent API key exposure
      let sanitizedError = error.message;
      if (sanitizedError && typeof sanitizedError === 'string') {
        sanitizedError = sanitizedError.replace(/sk-ant-[a-zA-Z0-9\-_]+/g, '[API_KEY_REDACTED]');
        sanitizedError = sanitizedError.replace(/worklog-ai\s+sk-ant-[a-zA-Z0-9\-_]+/g, '[INVALID_HEADER_REDACTED]');
      }
      
      return {
        success: false,
        error: sanitizedError || 'Insights generation failed'
      };
    }
  }

  // Generate performance review content
  async generatePerformanceReview(userData, timeframe) {
    try {
      console.log(`🤖 Generating performance review for ${timeframe}...`);
      
      const prompt = PromptTemplates.getPerformanceReviewPrompt(userData, timeframe);
      
      const response = await this.client.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 6000,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0].text;
      const reviewContent = JSON.parse(content);
      
      console.log('✅ Performance review generation completed successfully');
      return {
        success: true,
        data: reviewContent,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens
        }
      };

    } catch (error) {
      console.error('❌ Performance review generation failed:', error.message);
      
      // Sanitize error message to prevent API key exposure
      let sanitizedError = error.message;
      if (sanitizedError && typeof sanitizedError === 'string') {
        sanitizedError = sanitizedError.replace(/sk-ant-[a-zA-Z0-9\-_]+/g, '[API_KEY_REDACTED]');
        sanitizedError = sanitizedError.replace(/worklog-ai\s+sk-ant-[a-zA-Z0-9\-_]+/g, '[INVALID_HEADER_REDACTED]');
      }
      
      return {
        success: false,
        error: sanitizedError || 'Performance review generation failed'
      };
    }
  }

  // Generate resume bullet points
  async generateResumeBullets(achievements, targetRole = null) {
    try {
      console.log('🤖 Generating resume bullet points...');
      
      const prompt = PromptTemplates.getResumeBulletsPrompt(achievements, targetRole);
      
      const response = await this.client.messages.create({
        model: this.defaultModel,
        max_tokens: 3000,
        temperature: 0.2,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0].text;
      const bullets = JSON.parse(content);
      
      console.log('✅ Resume bullets generation completed successfully');
      return {
        success: true,
        data: bullets,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens
        }
      };

    } catch (error) {
      console.error('❌ Resume bullets generation failed:', error.message);
      
      // Sanitize error message to prevent API key exposure
      let sanitizedError = error.message;
      if (sanitizedError && typeof sanitizedError === 'string') {
        sanitizedError = sanitizedError.replace(/sk-ant-[a-zA-Z0-9\-_]+/g, '[API_KEY_REDACTED]');
        sanitizedError = sanitizedError.replace(/worklog-ai\s+sk-ant-[a-zA-Z0-9\-_]+/g, '[INVALID_HEADER_REDACTED]');
      }
      
      return {
        success: false,
        error: sanitizedError || 'Resume bullets generation failed'
      };
    }
  }

  // Validate and clean AI analysis result
  validateAndCleanAnalysisResult(result) {
    const cleaned = {
      projects: this.validateArray(result.projects, ['name', 'confidence']),
      skills: this.validateArray(result.skills, ['name', 'category', 'confidence']),
      competencies: this.validateArray(result.competencies, ['name', 'confidence']),
      achievements: this.validateArray(result.achievements, ['description']),
      people: this.validateArray(result.people, ['name']),
      keywords: Array.isArray(result.keywords) ? result.keywords.slice(0, 20) : [],
      sentiment: ['positive', 'neutral', 'negative'].includes(result.sentiment) ? result.sentiment : 'neutral',
      themes: Array.isArray(result.themes) ? result.themes.slice(0, 10) : [],
      workLocation: result.workLocation || 'other',
      timeSpent: result.timeSpent || null,
      nextActions: Array.isArray(result.nextActions) ? result.nextActions.slice(0, 5) : []
    };

    return cleaned;
  }

  // Helper to validate array fields
  validateArray(arr, requiredFields) {
    if (!Array.isArray(arr)) return [];
    
    return arr
      .filter(item => item && typeof item === 'object')
      .filter(item => requiredFields.every(field => item.hasOwnProperty(field)))
      .map(item => {
        // Ensure confidence is a valid number between 0 and 1
        if (item.confidence !== undefined) {
          item.confidence = Math.max(0, Math.min(1, parseFloat(item.confidence) || 0));
        }
        return item;
      })
      .slice(0, 50); // Limit array size
  }

  // Generate fallback analysis when AI fails
  generateFallbackAnalysis(entryText) {
    const words = entryText.toLowerCase().split(/\s+/);
    const keywords = words.filter(word => word.length > 3).slice(0, 10);
    
    return {
      projects: [],
      skills: [],
      competencies: [],
      achievements: [],
      people: [],
      keywords: keywords,
      sentiment: 'neutral',
      themes: [],
      workLocation: 'other',
      timeSpent: null,
      nextActions: []
    };
  }

  // Health check for the service
  async healthCheck() {
    try {
      const response = await this.client.messages.create({
        model: this.defaultModel,
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ]
      });
      
      return {
        status: 'healthy',
        model: this.defaultModel,
        responseReceived: !!response.content[0].text
      };
    } catch (error) {
      // Sanitize error message to prevent API key exposure
      let sanitizedError = error.message;
      if (sanitizedError && typeof sanitizedError === 'string') {
        sanitizedError = sanitizedError.replace(/sk-ant-[a-zA-Z0-9\-_]+/g, '[API_KEY_REDACTED]');
        sanitizedError = sanitizedError.replace(/worklog-ai\s+sk-ant-[a-zA-Z0-9\-_]+/g, '[INVALID_HEADER_REDACTED]');
      }
      
      return {
        status: 'unhealthy',
        error: sanitizedError || 'Health check failed'
      };
    }
  }
}

module.exports = ClaudeService;