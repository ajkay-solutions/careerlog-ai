// AI Prompt Templates for WorkLog AI Entry Analysis

class PromptTemplates {
  // Main analysis prompt for extracting structured data from work journal entries
  static getAnalysisPrompt(entryText, userContext = {}) {
    const contextSection = userContext.existingProjects || userContext.existingSkills ? 
      this.buildContextSection(userContext) : '';

    return `You are an AI assistant specialized in analyzing professional work journal entries to extract structured career data. Your task is to analyze the following work journal entry and extract relevant information.

${contextSection}

JOURNAL ENTRY TO ANALYZE:
"""
${entryText}
"""

Please analyze this entry and return a JSON response with the following structure:

{
  "projects": [
    {
      "name": "Project Name",
      "confidence": 0.85,
      "context": "Brief context from the entry"
    }
  ],
  "skills": [
    {
      "name": "Skill Name", 
      "category": "technical|soft|domain",
      "confidence": 0.90,
      "context": "How this skill was demonstrated"
    }
  ],
  "competencies": [
    {
      "name": "Competency Name",
      "framework": "leadership|innovation|communication|problem_solving|teamwork|custom",
      "confidence": 0.80,
      "evidence": "Specific evidence from the entry"
    }
  ],
  "achievements": [
    {
      "description": "Brief achievement description",
      "impact": "business|team|personal|technical",
      "quantifiable": true|false,
      "metrics": "Any numbers mentioned (if quantifiable)"
    }
  ],
  "people": [
    {
      "name": "Person Name",
      "role": "colleague|manager|client|external",
      "interaction": "Brief description of interaction"
    }
  ],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "sentiment": "positive|neutral|negative",
  "themes": ["theme1", "theme2"],
  "workLocation": "office|remote|hybrid|client_site|other",
  "timeSpent": "estimated hours if mentioned",
  "nextActions": ["action1", "action2"]
}

ANALYSIS GUIDELINES:
1. **Projects**: Look for project names, codenames, initiatives, or ongoing work streams
2. **Skills**: Identify technical skills, tools, programming languages, soft skills, and domain expertise demonstrated
3. **Competencies**: Extract leadership qualities, problem-solving approaches, and professional behaviors
4. **Achievements**: Focus on accomplishments, wins, completed tasks, and positive outcomes
5. **People**: Extract names and roles of individuals mentioned (colleagues, clients, etc.)
6. **Keywords**: Important terms that could be useful for search and categorization
7. **Sentiment**: Overall emotional tone of the entry
8. **Confidence scores**: Rate 0.0-1.0 based on how certain you are about each extraction

IMPORTANT:
- Only extract information that is explicitly mentioned or clearly implied
- Use confidence scores to indicate uncertainty
- For skills, categorize as: "technical" (programming, tools, software), "soft" (communication, leadership), or "domain" (industry-specific knowledge)
- For competencies, use standard frameworks when possible
- Be conservative with extractions - quality over quantity
- Return valid JSON only, no additional text

RESPOND WITH JSON ONLY:`;
  }

  // Context section to help AI understand user's existing data
  static buildContextSection(userContext) {
    let contextSection = '\nCONTEXT (User\'s existing data to help with consistency):\n';
    
    if (userContext.existingProjects?.length > 0) {
      contextSection += `Existing Projects: ${userContext.existingProjects.join(', ')}\n`;
    }
    
    if (userContext.existingSkills?.length > 0) {
      contextSection += `Existing Skills: ${userContext.existingSkills.join(', ')}\n`;
    }
    
    if (userContext.existingCompetencies?.length > 0) {
      contextSection += `Existing Competencies: ${userContext.existingCompetencies.join(', ')}\n`;
    }
    
    if (userContext.jobTitle) {
      contextSection += `Job Title: ${userContext.jobTitle}\n`;
    }
    
    if (userContext.industry) {
      contextSection += `Industry: ${userContext.industry}\n`;
    }
    
    contextSection += '\nPlease prioritize consistency with existing data while still identifying new elements.\n';
    
    return contextSection;
  }

  // Prompt for summarizing multiple entries for insights
  static getInsightSummaryPrompt(entries, timeframe) {
    return `You are analyzing ${entries.length} work journal entries from ${timeframe} to generate professional insights. 

ENTRIES TO ANALYZE:
${entries.map((entry, index) => `
Entry ${index + 1} (${entry.date}):
${entry.rawText}
---`).join('\n')}

Generate a comprehensive analysis in the following JSON format:

{
  "summary": {
    "totalEntries": ${entries.length},
    "timeframe": "${timeframe}",
    "overallSentiment": "positive|neutral|negative",
    "productivityTrend": "increasing|stable|decreasing",
    "keyThemes": ["theme1", "theme2", "theme3"]
  },
  "topProjects": [
    {
      "name": "Project Name",
      "frequency": 5,
      "lastMentioned": "2025-01-15",
      "status": "active|completed|stalled"
    }
  ],
  "skillsDeveloped": [
    {
      "name": "Skill Name",
      "category": "technical|soft|domain",
      "frequency": 3,
      "firstMentioned": "2025-01-10",
      "lastMentioned": "2025-01-15"
    }
  ],
  "competenciesShown": [
    {
      "name": "Competency Name",
      "evidence": ["evidence1", "evidence2"],
      "strength": "strong|moderate|emerging"
    }
  ],
  "achievements": [
    {
      "description": "Achievement description",
      "date": "2025-01-15",
      "impact": "high|medium|low"
    }
  ],
  "patterns": {
    "mostProductiveDays": ["Monday", "Wednesday"],
    "commonChallenges": ["challenge1", "challenge2"],
    "workStyles": ["collaborative", "detail-oriented"],
    "improvementAreas": ["area1", "area2"]
  },
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2",
    "Recommendation 3"
  ]
}

Focus on actionable insights that could help with performance reviews, career development, and identifying growth opportunities.

RESPOND WITH JSON ONLY:`;
  }

  // Prompt for generating performance review content
  static getPerformanceReviewPrompt(userData, timeframe) {
    return `Generate a professional performance review summary based on the following work journal data from ${timeframe}:

USER DATA:
${JSON.stringify(userData, null, 2)}

Generate performance review content in the following JSON format:

{
  "executiveSummary": "2-3 sentence overview of performance and key contributions",
  "keyAccomplishments": [
    {
      "title": "Accomplishment Title",
      "description": "Detailed description with specific examples",
      "impact": "Quantified impact where possible",
      "skills": ["skill1", "skill2"]
    }
  ],
  "projectContributions": [
    {
      "project": "Project Name",
      "role": "Role/responsibility",
      "outcomes": "Specific outcomes and deliverables",
      "skills": ["skill1", "skill2"]
    }
  ],
  "skillsDemonstrated": {
    "technical": ["skill1", "skill2"],
    "soft": ["skill1", "skill2"],
    "domain": ["skill1", "skill2"]
  },
  "competenciesShown": [
    {
      "competency": "Competency Name",
      "evidence": ["evidence1", "evidence2"],
      "level": "exceeds|meets|developing"
    }
  ],
  "growthAreas": [
    {
      "area": "Area for development",
      "reasoning": "Why this is important",
      "suggestions": ["suggestion1", "suggestion2"]
    }
  ],
  "goals": {
    "achieved": ["goal1", "goal2"],
    "inProgress": ["goal1", "goal2"],
    "recommended": ["goal1", "goal2"]
  }
}

Write in a professional tone suitable for formal performance reviews. Focus on measurable outcomes and specific examples.

RESPOND WITH JSON ONLY:`;
  }

  // Prompt for generating resume bullet points
  static getResumeBulletsPrompt(achievements, targetRole = null) {
    const roleContext = targetRole ? `Target Role: ${targetRole}\n` : '';
    
    return `Generate professional resume bullet points from the following achievements and work experiences:

${roleContext}
ACHIEVEMENTS TO CONVERT:
${JSON.stringify(achievements, null, 2)}

Generate resume bullets in the following JSON format:

{
  "bulletPoints": [
    {
      "text": "Action verb + specific achievement + quantifiable impact",
      "category": "leadership|technical|project_management|innovation|collaboration",
      "strength": "high|medium|low",
      "keywords": ["keyword1", "keyword2"]
    }
  ],
  "suggestions": {
    "improvementAreas": ["area1", "area2"],
    "missingMetrics": ["What metrics could strengthen these bullets"],
    "alternatePhrasing": [
      {
        "original": "Original bullet",
        "improved": "Improved version with stronger action verbs"
      }
    ]
  }
}

GUIDELINES:
- Start with strong action verbs (Led, Implemented, Optimized, Delivered, etc.)
- Include quantifiable results where possible (percentages, numbers, timeframes)
- Use keywords relevant to the target role
- Keep bullets concise but impactful
- Focus on outcomes and business impact
${targetRole ? `- Tailor language and keywords for ${targetRole} role` : ''}

RESPOND WITH JSON ONLY:`;
  }
}

module.exports = PromptTemplates;