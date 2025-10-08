// Template preferences management utility

const STORAGE_KEY = 'worklog_ai_template_preference';
const DEFAULT_TEMPLATE = 'free-form';

/**
 * Get user's preferred template from localStorage
 * @returns {string} Template ID (defaults to 'free-form')
 */
export const getTemplatePreference = () => {
  try {
    const preference = localStorage.getItem(STORAGE_KEY);
    return preference || DEFAULT_TEMPLATE;
  } catch (error) {
    console.warn('Failed to get template preference:', error);
    return DEFAULT_TEMPLATE;
  }
};

/**
 * Save user's template preference to localStorage
 * @param {string} templateId - Template ID to save
 */
export const setTemplatePreference = (templateId) => {
  try {
    localStorage.setItem(STORAGE_KEY, templateId);
  } catch (error) {
    console.warn('Failed to save template preference:', error);
  }
};

/**
 * Detect if content contains only template prompts (no real user content)
 * @param {string} content - The text content to analyze
 * @param {string} templateContent - The template structure to compare against
 * @returns {boolean} True if content appears to be only template prompts
 */
export const isOnlyTemplateContent = (content, templateContent) => {
  if (!content || content.trim() === '') {
    return true;
  }

  // Remove the template structure and see what's left
  let userContent = content;
  
  // Remove common template prompts/sections
  const templatePatterns = [
    /Today's work journal\.\.\./gi,
    /Tips: Mention projects, achievements, skills used, people you worked with, challenges solved, or anything noteworthy from your day\./gi,
    /📋 Today's highlights:/gi,
    /🛠️ Skills I used:/gi,
    /👥 People I worked with:/gi,
    /🎯 Today I worked on:/gi,
    /🏆 Something I'm proud of:/gi,
    /📚 What I learned:/gi,
    /🤝 Who I collaborated with:/gi,
    /✅ What I accomplished:/gi,
    /🔧 How I did it:/gi,
    /📈 Impact or results:/gi,
    /📝 What I worked on today:/gi,
    /🎉 Any wins or accomplishments\?/gi,
    /🚧 Challenges I faced:/gi,
    /^•\s*$/gm, // Empty bullet points
    /^\s*$/gm   // Empty lines
  ];

  // Remove all template patterns
  templatePatterns.forEach(pattern => {
    userContent = userContent.replace(pattern, '');
  });

  // Clean up extra whitespace and check if anything meaningful remains
  userContent = userContent.trim();
  
  // If less than 10 characters of actual content remain, consider it template-only
  return userContent.length < 10;
};

/**
 * Extract actual user content from a templated entry
 * @param {string} content - The full content including template
 * @param {string} templateContent - The template structure to remove
 * @returns {string} Just the user-written content
 */
export const extractUserContent = (content, templateContent) => {
  if (!content) return '';

  let userContent = content;
  
  // Remove template prompts but preserve user text
  const templateLines = templateContent.split('\n');
  const contentLines = content.split('\n');
  
  // Filter out lines that are template prompts
  const userLines = contentLines.filter(line => {
    const trimmedLine = line.trim();
    
    // Keep lines that don't match template patterns
    const isTemplateLine = templateLines.some(templateLine => {
      const trimmedTemplate = templateLine.trim();
      return trimmedTemplate && trimmedLine === trimmedTemplate;
    });
    
    // Also remove common template patterns
    const isTemplatePattern = /^(📋|🛠️|👥|🎯|🏆|📚|🤝|✅|🔧|📈|📝|🎉|🚧)\s/.test(trimmedLine) && 
                              trimmedLine.endsWith(':');
    
    // Keep bullet points that have content after them
    const isBulletWithContent = /^•\s+.+/.test(trimmedLine);
    
    return !isTemplateLine && !isTemplatePattern && (isBulletWithContent || 
           (!trimmedLine.startsWith('•') && trimmedLine.length > 0));
  });
  
  return userLines.join('\n').trim();
};

/**
 * Merge user content with a new template
 * @param {string} userContent - The actual user content to preserve
 * @param {string} newTemplateContent - The new template structure
 * @returns {string} Combined content with user text preserved
 */
export const mergeContentWithTemplate = (userContent, newTemplateContent) => {
  if (!userContent || userContent.trim() === '') {
    return newTemplateContent;
  }

  // For now, append user content at the end of the template
  // Future enhancement: could be smarter about placing content in appropriate sections
  return newTemplateContent + '\n' + userContent;
};