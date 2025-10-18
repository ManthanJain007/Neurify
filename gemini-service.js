// Gemini API Service for AI Writing Assistant Pro
// Implements all 50+ features from the comprehensive feature list

class GeminiAPIService {
  constructor() {
    this.apiKey = window.PRODUCTION_CONFIG?.GEMINI_API_KEY || 'AIzaSyB6xR1anuTx-HTPv-EoFBjPPTyVdtf3sYQ';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.model = 'gemini-1.5-flash-latest';
    this.initialized = false;
    this.rateLimiter = new Map(); // Simple rate limiting
    this.cache = new Map(); // Response caching
    
    // Feature-specific prompts and configurations
    this.prompts = this.initializePrompts();
    this.grammarRules = this.initializeGrammarRules();
    this.styleGuides = this.initializeStyleGuides();
    this.toneProfiles = this.initializeToneProfiles();
    this.personaProfiles = this.initializePersonaProfiles();
    
    // Analytics and learning
    this.learningData = [];
    this.analytics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      featuresUsed: new Map()
    };

    // Initialize immediately with available API key
    if (this.apiKey) {
      this.initialize(this.apiKey).catch(error => {
        console.warn('Auto-initialization failed:', error);
      });
    }
  }

  async initialize(apiKey = null) {
    if (apiKey) {
      this.apiKey = apiKey;
    }
    
    if (!this.apiKey) {
      console.warn('Gemini API key not provided. Please set it in extension options.');
      return false;
    }
    
    try {
      // Test API connection
      await this.testConnection();
      this.initialized = true;
      console.log('Gemini API service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Gemini API service:', error);
      return false;
    }
  }

  async testConnection() {
    const response = await fetch(`${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Test connection' }]
        }],
        generationConfig: {
          maxOutputTokens: 10,
          temperature: 0.1
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API test failed: ${response.status}`);
    }

    return await response.json();
  }

  // CORE WRITING FEATURES (Features 1-4)

  async advancedGrammarCheck(text, options = {}) {
    const prompt = `${this.prompts.grammarCheck.base}

Text to analyze: "${text}"

Perform comprehensive grammar analysis covering:
1. Real-time grammar error detection
2. Context-aware spell checking
3. Punctuation correction (commas, semicolons, quotes)
4. Sentence fragment identification
5. Run-on sentence detection
6. Subject-verb agreement checking
7. Verb tense consistency
8. Article usage (a/an/the)
9. Preposition accuracy

Language variant: ${options.language || 'en-US'}

${this.prompts.grammarCheck.instructions}`;

    return await this.generateContent(prompt, {
      temperature: 0.1,
      maxOutputTokens: 2000,
      featureType: 'grammarCheck'
    });
  }

  async spellingAndMechanics(text, options = {}) {
    const prompt = `${this.prompts.spelling.base}

Text to analyze: "${text}"

Check for:
1. Multi-dialect spelling (${options.dialect || 'US'} English)
2. Homophone detection (their/there/they're)
3. Commonly confused words
4. Capitalization rules
5. Apostrophe usage
6. Number formatting
7. Abbreviation consistency

${this.prompts.spelling.instructions}`;

    return await this.generateContent(prompt, {
      temperature: 0.1,
      maxOutputTokens: 1500,
      featureType: 'spelling'
    });
  }

  async styleEnhancement(text, options = {}) {
    const prompt = `${this.prompts.styleEnhancement.base}

Text to enhance: "${text}"

Focus on:
1. Conciseness: Flag wordy phrases and suggest alternatives
2. Clarity: Simplify complex sentences
3. Vocabulary: Suggest stronger, more precise words
4. Readability: Improve Flesch-Kincaid score
5. Sentence Variety: Mix short and long sentences
6. Active Voice: Convert passive to active voice
7. Transition Words: Improve flow between ideas

Style intensity: ${options.intensity || 'balanced'}
Target audience: ${options.audience || 'general'}

${this.prompts.styleEnhancement.instructions}`;

    return await this.generateContent(prompt, {
      temperature: 0.3,
      maxOutputTokens: 2000,
      featureType: 'styleEnhancement'
    });
  }

  async humanizeText(text, options = {}) {
    const prompt = `${this.prompts.humanization.base}

Text to humanize: "${text}"

Apply these humanization techniques:
1. Pattern Breaking: Restructure predictable AI sentence patterns
2. Natural Flow: Add conversational rhythm
3. Idiom Integration: Smart inclusion of natural phrases
4. Contraction Control: Auto-convert formal to informal contractions
5. Human "Flaws": Add natural imperfections where appropriate
6. Emotional Tone: Inject appropriate emotion into text
7. Personal Pronouns: Make text more engaging with "you/I/we"

Humanization level: ${options.level || 'moderate'}
Keep formality: ${options.keepFormality || false}

${this.prompts.humanization.instructions}`;

    return await this.generateContent(prompt, {
      temperature: 0.7,
      maxOutputTokens: 2000,
      featureType: 'humanization'
    });
  }

  // TONE & PERSONA ADAPTATION (Features 5-6)

  async detectTone(text) {
    const prompt = `${this.prompts.toneDetection.base}

Text to analyze: "${text}"

Detect the current tone and classify it as one or more of:
- Formal: Professional, academic writing
- Casual: Friendly, conversational tone
- Professional: Business-appropriate
- Creative: Storytelling, descriptive writing
- Persuasive: Sales and marketing copy
- Technical: Documentation, instructions
- Empathetic: Supportive, understanding tone

Also provide:
- Confidence score (0-1)
- Specific tone indicators found
- Suggested tone adjustments if needed

${this.prompts.toneDetection.instructions}`;

    return await this.generateContent(prompt, {
      temperature: 0.2,
      maxOutputTokens: 1000,
      featureType: 'toneDetection'
    });
  }

  async adjustTone(text, targetTone, options = {}) {
    const toneProfile = this.toneProfiles[targetTone] || this.toneProfiles.professional;
    
    const prompt = `${this.prompts.toneAdjustment.base}

Text to adjust: "${text}"
Target tone: ${targetTone}

Tone characteristics:
${toneProfile.description}

Key elements to incorporate:
${toneProfile.elements.join(', ')}

Maintain original meaning: ${options.preserveMeaning !== false}
Adjustment intensity: ${options.intensity || 'moderate'}

${this.prompts.toneAdjustment.instructions}`;

    return await this.generateContent(prompt, {
      temperature: 0.4,
      maxOutputTokens: 2000,
      featureType: 'toneAdjustment'
    });
  }

  async applyPersona(text, persona, context = '') {
    const personaProfile = this.personaProfiles[persona] || this.personaProfiles.professional;
    
    const prompt = `${this.prompts.personaWriting.base}

Text to adapt: "${text}"
Target persona: ${persona}
Context: ${context}

Persona characteristics:
- Writing style: ${personaProfile.style}
- Vocabulary level: ${personaProfile.vocabulary}
- Typical use cases: ${personaProfile.useCases.join(', ')}
- Key traits: ${personaProfile.traits.join(', ')}

${this.prompts.personaWriting.instructions}`;

    return await this.generateContent(prompt, {
      temperature: 0.5,
      maxOutputTokens: 2000,
      featureType: 'personaWriting'
    });
  }

  // ADVANCED FEATURES (Features 7-9)

  async realTimeAnalysis(text, options = {}) {
    const analysisType = options.type || 'comprehensive';
    
    const prompt = `${this.prompts.realTimeAnalysis.base}

Text for real-time analysis: "${text}"

Provide instant analysis with:
1. Color-coded issue categorization:
   - Red: Critical errors (grammar, spelling) 
   - Blue: Style improvements
   - Green: Enhancement opportunities
   - Yellow: Tone adjustments

2. Metrics:
   - Word count and character count
   - Readability score (Flesch-Kincaid)
   - Reading time estimation
   - Complexity score

3. Quick suggestions for immediate improvement

Analysis depth: ${analysisType}
Response format: structured JSON for UI integration

${this.prompts.realTimeAnalysis.instructions}`;

    return await this.generateContent(prompt, {
      temperature: 0.2,
      maxOutputTokens: 1500,
      featureType: 'realTimeAnalysis'
    });
  }

  async generateSmartSuggestions(text, category, options = {}) {
    const prompt = `${this.prompts.smartSuggestions.base}

Text: "${text}"
Category: ${category}

Generate multiple alternative suggestions with:
1. Multiple options per issue (2-3 alternatives)
2. Detailed explanations for each correction
3. Confidence scores
4. Category-specific improvements:
   ${this.getCategorySpecificPrompt(category)}

Learning context: ${JSON.stringify(options.learningContext || {})}
User preferences: ${JSON.stringify(options.userPreferences || {})}

${this.prompts.smartSuggestions.instructions}`;

    return await this.generateContent(prompt, {
      temperature: 0.4,
      maxOutputTokens: 2000,
      featureType: 'smartSuggestions'
    });
  }

  async optimizeContent(text, optimizationType, options = {}) {
    let specificPrompt = '';
    
    switch (optimizationType) {
      case 'seo':
        specificPrompt = `${this.prompts.seoOptimization.base}
        Target keywords: ${options.keywords || ''}
        Meta description optimization: ${options.metaDescription || false}`;
        break;
      
      case 'engagement':
        specificPrompt = `${this.prompts.engagementOptimization.base}
        Target audience: ${options.audience || 'general'}
        Platform: ${options.platform || 'web'}`;
        break;
      
      case 'accessibility':
        specificPrompt = `${this.prompts.accessibilityOptimization.base}
        Screen reader compatibility: ${options.screenReader || true}
        Cognitive load reduction: ${options.cognitiveLoad || true}`;
        break;
      
      case 'plagiarism':
        specificPrompt = `${this.prompts.plagiarismCheck.base}
        Check for similarity patterns and suggest original alternatives`;
        break;
      
      case 'consistency':
        specificPrompt = `${this.prompts.consistencyCheck.base}
        Check term usage, style consistency, and formatting uniformity`;
        break;
    }

    const prompt = `${specificPrompt}

Text to optimize: "${text}"

${this.prompts.contentOptimization.instructions}`;

    return await this.generateContent(prompt, {
      temperature: 0.3,
      maxOutputTokens: 2000,
      featureType: 'contentOptimization'
    });
  }

  // PRODUCTIVITY TOOLS (Features 19-20)

  async processQuickActions(text, action, options = {}) {
    const actionPrompts = {
      'fix-all-grammar': 'Fix all grammar and spelling errors while preserving meaning',
      'fix-all-style': 'Apply all style improvements for clarity and conciseness',
      'fix-all-tone': `Adjust entire text to ${options.targetTone || 'professional'} tone`,
      'bulk-process': 'Process multiple text segments with consistent improvements',
      'template-insert': `Insert ${options.templateType || 'professional'} template elements`,
      'export-clean': 'Provide clean, corrected version ready for export'
    };

    const prompt = `${this.prompts.quickActions.base}

Action: ${action}
Text: "${text}"

Task: ${actionPrompts[action] || action}

Additional context: ${JSON.stringify(options)}

${this.prompts.quickActions.instructions}`;

    return await this.generateContent(prompt, {
      temperature: 0.2,
      maxOutputTokens: 2000,
      featureType: 'quickActions'
    });
  }

  async generateAnalytics(textHistory, options = {}) {
    const prompt = `${this.prompts.analytics.base}

Text history: ${JSON.stringify(textHistory.slice(-10))} // Last 10 entries

Generate comprehensive writing analytics:

1. Writing Analytics:
   - Most common errors and patterns
   - Improvement areas
   - Vocabulary usage patterns

2. Improvement Tracking:
   - Progress over time
   - Skill development metrics
   - Achievement milestones

3. Vocabulary Growth:
   - New words introduced
   - Vocabulary sophistication score
   - Domain-specific terminology usage

4. Readability Trends:
   - Average readability scores over time
   - Clarity improvement metrics
   - Audience appropriateness scores

5. Productivity Metrics:
   - Time saved with corrections
   - Efficiency improvements
   - Writing speed enhancements

Time period: ${options.timePeriod || 'last 30 days'}
Focus areas: ${JSON.stringify(options.focusAreas || ['all'])}

${this.prompts.analytics.instructions}`;

    return await this.generateContent(prompt, {
      temperature: 0.1,
      maxOutputTokens: 3000,
      featureType: 'analytics'
    });
  }

  // WORKFLOW INTEGRATION (Features 25-26)

  async adaptToContext(text, context, options = {}) {
    const contextPrompts = {
      'email': 'Professional email communication with appropriate tone and structure',
      'social-media': 'Engaging social media content optimized for platform and audience', 
      'academic': 'Academic writing with formal structure and citation-ready format',
      'technical': 'Technical documentation with precision and clarity',
      'marketing': 'Marketing copy with persuasive language and engagement focus',
      'creative': 'Creative writing with expressive and descriptive language'
    };

    const prompt = `${this.prompts.contextAdaptation.base}

Text: "${text}"
Context: ${context}
Platform: ${options.platform || 'general'}

Adaptation requirements:
${contextPrompts[context] || 'General professional writing'}

Specific considerations:
- Audience: ${options.audience || 'general'}
- Purpose: ${options.purpose || 'inform'}
- Constraints: ${JSON.stringify(options.constraints || {})}

${this.prompts.contextAdaptation.instructions}`;

    return await this.generateContent(prompt, {
      temperature: 0.4,
      maxOutputTokens: 2000,
      featureType: 'contextAdaptation'
    });
  }

  async learnFromCorrections(originalText, correctedText, userChoice, context = {}) {
    // Store learning data for personalization
    const learningEntry = {
      timestamp: Date.now(),
      original: originalText,
      corrected: correctedText,
      userChoice: userChoice,
      context: context
    };

    // In a real implementation, this would update a user model
    // For now, we'll store it in chrome.storage
    try {
      const { learningData = [] } = await chrome.storage.local.get(['learningData']);
      learningData.push(learningEntry);
      
      // Keep only last 1000 entries
      if (learningData.length > 1000) {
        learningData.splice(0, learningData.length - 1000);
      }
      
      await chrome.storage.local.set({ learningData });
      
      // Generate personalized insights
      if (learningData.length > 10) {
        return await this.generatePersonalizedInsights(learningData.slice(-50));
      }
    } catch (error) {
      console.error('Failed to store learning data:', error);
    }
    
    return { success: true, learned: true };
  }

  async generatePersonalizedInsights(learningData) {
    const prompt = `${this.prompts.personalization.base}

Learning data from user corrections: ${JSON.stringify(learningData)}

Generate personalized insights:

1. Writing Patterns:
   - Common error types
   - Preferred correction styles
   - Consistency preferences

2. Skill Building:
   - Areas showing improvement
   - Persistent challenges
   - Recommended focus areas

3. Adaptive Suggestions:
   - Personalized correction preferences
   - Context-specific adaptations
   - User style recognition

4. Improvement Goals:
   - Short-term objectives
   - Long-term development areas
   - Skill-building recommendations

${this.prompts.personalization.instructions}`;

    return await this.generateContent(prompt, {
      temperature: 0.3,
      maxOutputTokens: 2000,
      featureType: 'personalization'
    });
  }

  // UTILITY METHODS

  async generateContent(prompt, config = {}) {
    if (!this.initialized) {
      throw new Error('Gemini API service not initialized. Please provide API key.');
    }

    const startTime = Date.now();
    this.analytics.totalRequests++;

    // Check rate limiting
    const now = Date.now();
    const rateLimitKey = 'api_calls';
    const rateLimitData = this.rateLimiter.get(rateLimitKey) || { count: 0, resetTime: now + 60000 };
    
    if (now < rateLimitData.resetTime && rateLimitData.count >= 60) {
      this.analytics.failedRequests++;
      throw new Error('Rate limit exceeded. Please wait before making more requests.');
    }
    
    if (now >= rateLimitData.resetTime) {
      rateLimitData.count = 0;
      rateLimitData.resetTime = now + 60000;
    }

    // Check cache
    const cacheKey = this.generateCacheKey(prompt, config);
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (now - cached.timestamp < 300000) { // 5 minute cache
        this.analytics.successfulRequests++;
        return cached.data;
      } else {
        this.cache.delete(cacheKey);
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: config.temperature || 0.3,
            topK: config.topK || 40,
            topP: config.topP || 0.95,
            maxOutputTokens: config.maxOutputTokens || 1000,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH', 
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.analytics.failedRequests++;
        throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const result = {
        text: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
        finishReason: data.candidates?.[0]?.finishReason,
        safetyRatings: data.candidates?.[0]?.safetyRatings
      };

      // Update analytics
      const responseTime = Date.now() - startTime;
      this.analytics.successfulRequests++;
      this.analytics.averageResponseTime = 
        (this.analytics.averageResponseTime * (this.analytics.successfulRequests - 1) + responseTime) / 
        this.analytics.successfulRequests;

      // Track feature usage
      const featureType = config.featureType || 'general';
      const currentCount = this.analytics.featuresUsed.get(featureType) || 0;
      this.analytics.featuresUsed.set(featureType, currentCount + 1);

      // Update rate limiting
      rateLimitData.count++;
      this.rateLimiter.set(rateLimitKey, rateLimitData);

      // Cache result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: now
      });

      // Clean old cache entries
      if (this.cache.size > 100) {
        const oldestKey = this.cache.keys().next().value;
        this.cache.delete(oldestKey);
      }

      return result;

    } catch (error) {
      this.analytics.failedRequests++;
      console.error('Gemini API request failed:', error);
      throw error;
    }
  }

  generateCacheKey(prompt, config) {
    return btoa(prompt.substring(0, 100) + JSON.stringify(config)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 50);
  }

  // ANALYTICS AND LEARNING METHODS

  getAnalytics() {
    return {
      ...this.analytics,
      featuresUsed: Object.fromEntries(this.analytics.featuresUsed),
      successRate: this.analytics.totalRequests > 0 ? 
        (this.analytics.successfulRequests / this.analytics.totalRequests) * 100 : 0
    };
  }

  async learnFromUserCorrections(originalText, correctedText, userChoice, context = {}) {
    const learningEntry = {
      timestamp: Date.now(),
      originalText,
      correctedText,
      userChoice,
      context,
      features: context.features || [],
      domain: context.domain || 'general'
    };

    this.learningData.push(learningEntry);

    // Keep only last 1000 learning entries
    if (this.learningData.length > 1000) {
      this.learningData = this.learningData.slice(-1000);
    }

    // Generate personalized insights
    return await this.generatePersonalizedInsights();
  }

  async generatePersonalizedInsights() {
    if (this.learningData.length < 5) {
      return { message: 'Need more data for personalized insights' };
    }

    const recentData = this.learningData.slice(-50);
    const commonPatterns = this.analyzeLearningPatterns(recentData);

    const prompt = `Based on the user's writing patterns and corrections, provide personalized insights:

Recent corrections: ${recentData.length}
Common issues: ${commonPatterns.issues.join(', ')}
Preferred styles: ${commonPatterns.styles.join(', ')}
Domain focus: ${commonPatterns.domains.join(', ')}

Provide 3-5 personalized writing tips and suggestions.`;

    try {
      const result = await this.generateContent(prompt, { 
        featureType: 'personalization',
        temperature: 0.7 
      });
      return {
        insights: result.text,
        patterns: commonPatterns,
        dataPoints: recentData.length
      };
    } catch (error) {
      console.error('Failed to generate personalized insights:', error);
      return { error: 'Unable to generate insights at this time' };
    }
  }

  analyzeLearningPatterns(data) {
    const issues = new Map();
    const styles = new Map();
    const domains = new Map();

    data.forEach(entry => {
      // Analyze common issues
      if (entry.userChoice === 'rejected') {
        const issueType = this.categorizeIssue(entry.originalText, entry.correctedText);
        issues.set(issueType, (issues.get(issueType) || 0) + 1);
      }

      // Analyze style preferences
      if (entry.userChoice === 'accepted') {
        const styleType = this.categorizeStyle(entry.correctedText);
        styles.set(styleType, (styles.get(styleType) || 0) + 1);
      }

      // Analyze domain usage
      if (entry.domain) {
        domains.set(entry.domain, (domains.get(entry.domain) || 0) + 1);
      }
    });

    return {
      issues: Array.from(issues.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([issue]) => issue),
      styles: Array.from(styles.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([style]) => style),
      domains: Array.from(domains.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([domain]) => domain)
    };
  }

  categorizeIssue(original, corrected) {
    // Simple categorization based on text differences
    if (original.length > corrected.length * 1.2) return 'wordiness';
    if (corrected.length > original.length * 1.2) return 'clarity';
    if (original.toLowerCase() !== corrected.toLowerCase()) return 'grammar';
    return 'style';
  }

  categorizeStyle(text) {
    // Simple style categorization
    if (text.includes('!')) return 'enthusiastic';
    if (text.includes('?')) return 'inquisitive';
    if (text.length > 100) return 'detailed';
    return 'concise';
  }

  resetAnalytics() {
    this.analytics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      featuresUsed: new Map()
    };
  }

  exportLearningData() {
    return {
      learningData: this.learningData,
      analytics: this.getAnalytics(),
      exportDate: new Date().toISOString()
    };
  }

  getCategorySpecificPrompt(category) {
    const categoryPrompts = {
      'grammar': 'Focus on grammatical accuracy, verb tenses, and sentence structure',
      'spelling': 'Check for spelling errors, homophones, and commonly confused words',
      'style': 'Improve clarity, conciseness, and readability',
      'tone': 'Adjust emotional tone and formality level',
      'humanization': 'Make text sound more natural and conversational',
      'seo': 'Optimize for search engines while maintaining readability'
    };
    
    return categoryPrompts[category] || 'Provide general writing improvements';
  }

  // PROMPT INITIALIZATION METHODS

  initializePrompts() {
    return {
      grammarCheck: {
        base: "You are an expert grammar and language specialist. Analyze the following text for all types of grammatical errors and provide detailed, actionable corrections.",
        instructions: "Return a structured JSON response with: 1) Array of specific errors found, 2) Corrected version of text, 3) Explanations for each correction, 4) Confidence scores. Focus on accuracy and clarity."
      },
      
      spelling: {
        base: "You are a spelling and mechanics expert specializing in multi-dialect English. Check the text for spelling errors, punctuation issues, and mechanical problems.",
        instructions: "Provide detailed corrections with explanations, focusing on context-appropriate suggestions for the specified English dialect."
      },
      
      styleEnhancement: {
        base: "You are a professional writing coach focused on style improvement. Enhance the text for clarity, conciseness, and engagement.",
        instructions: "Suggest specific improvements with before/after examples. Calculate readability improvements and explain the benefits of each change."
      },
      
      humanization: {
        base: "You are an expert at making AI-generated text sound naturally human. Transform robotic or overly formal text into natural, conversational writing.",
        instructions: "Apply subtle human touches while preserving the core message. Vary sentence structure, add natural transitions, and inject appropriate personality."
      },
      
      toneDetection: {
        base: "You are a tone analysis expert. Analyze the emotional tone, formality level, and stylistic characteristics of the text.",
        instructions: "Provide confidence scores and specific evidence for your tone assessment. Suggest improvements if the tone doesn't match the intended audience."
      },
      
      toneAdjustment: {
        base: "You are a tone adjustment specialist. Modify the text to match the specified tone while preserving the original meaning and key information.",
        instructions: "Make subtle but effective adjustments. Provide before/after comparisons and explain how each change contributes to the target tone."
      },
      
      personaWriting: {
        base: "You are a writing specialist who adapts content to specific professional personas and contexts.",
        instructions: "Transform the text to match the specified persona's typical writing style, vocabulary, and communication patterns."
      },
      
      realTimeAnalysis: {
        base: "You are a real-time writing analysis engine. Provide instant feedback on text quality across multiple dimensions.",
        instructions: "Generate structured analysis data suitable for UI integration. Include specific issue locations, severity levels, and quick-fix suggestions."
      },
      
      smartSuggestions: {
        base: "You are an intelligent writing assistant that provides multiple high-quality suggestions for each identified issue.",
        instructions: "Offer 2-3 alternatives per issue with clear explanations. Rank suggestions by appropriateness and include confidence scores."
      },
      
      seoOptimization: {
        base: "You are an SEO writing specialist. Optimize content for search engines while maintaining natural readability and user engagement.",
        instructions: "Suggest keyword integration, meta description improvements, and structure enhancements that boost SEO without sacrificing quality."
      },
      
      engagementOptimization: {
        base: "You are an engagement specialist focused on making content more compelling and reader-friendly.",
        instructions: "Suggest improvements that increase reader engagement, emotional connection, and action-oriented outcomes."
      },
      
      accessibilityOptimization: {
        base: "You are an accessibility expert. Optimize text for screen readers, cognitive accessibility, and inclusive design.",
        instructions: "Ensure clear structure, simple language where appropriate, and universal design principles."
      },
      
      plagiarismCheck: {
        base: "You are a plagiarism detection specialist. Identify potentially unoriginal content and suggest unique alternatives.",
        instructions: "Flag suspicious patterns and provide original rewrite suggestions that maintain the same information value."
      },
      
      consistencyCheck: {
        base: "You are a consistency specialist. Check for uniform terminology, style, and formatting throughout the text.",
        instructions: "Identify inconsistencies in naming, style choices, and formatting. Suggest standardization improvements."
      },
      
      contentOptimization: {
        base: "You are a content optimization expert specializing in improving text for specific purposes and platforms.",
        instructions: "Apply optimization techniques appropriate for the specified context while maintaining content quality and authenticity."
      },
      
      quickActions: {
        base: "You are a rapid text processing specialist. Apply bulk improvements efficiently while maintaining text quality.",
        instructions: "Process the text according to the specified action with speed and accuracy. Provide summary of changes made."
      },
      
      analytics: {
        base: "You are a writing analytics specialist. Generate insights about writing patterns, improvements, and productivity metrics.",
        instructions: "Provide actionable insights with specific data points, trends, and recommendations for improvement."
      },
      
      contextAdaptation: {
        base: "You are a context adaptation specialist. Modify text to be appropriate for specific platforms, audiences, and purposes.",
        instructions: "Apply context-specific optimizations while preserving core message and maintaining authenticity."
      },
      
      personalization: {
        base: "You are a personalization engine that learns from user behavior and preferences to provide customized writing assistance.",
        instructions: "Generate insights that help adapt future suggestions to the user's specific writing style and preferences."
      }
    };
  }

  initializeGrammarRules() {
    return {
      sentenceStructure: ['fragment', 'run-on', 'comma-splice'],
      verbForms: ['tense-consistency', 'subject-verb-agreement', 'irregular-verbs'],
      punctuation: ['comma-usage', 'semicolon', 'apostrophe', 'quotation-marks'],
      articles: ['a-an-usage', 'definite-article', 'article-omission'],
      prepositions: ['preposition-choice', 'phrasal-verbs', 'idiomatic-usage']
    };
  }

  initializeStyleGuides() {
    return {
      conciseness: ['wordy-phrases', 'redundancy', 'unnecessary-words'],
      clarity: ['complex-sentences', 'jargon', 'ambiguity'],
      engagement: ['passive-voice', 'weak-verbs', 'transition-words'],
      readability: ['sentence-length', 'paragraph-structure', 'vocabulary-level']
    };
  }

  initializeToneProfiles() {
    return {
      formal: {
        description: 'Professional, academic writing with elevated vocabulary and complex sentence structures',
        elements: ['elevated vocabulary', 'complex sentences', 'objective perspective', 'minimal contractions']
      },
      casual: {
        description: 'Friendly, conversational tone with relaxed language and personal touches',
        elements: ['contractions', 'personal pronouns', 'simple vocabulary', 'conversational phrases']
      },
      professional: {
        description: 'Business-appropriate communication that balances formality with accessibility',
        elements: ['clear communication', 'respectful language', 'action-oriented', 'confident tone']
      },
      creative: {
        description: 'Expressive, imaginative writing with vivid language and emotional engagement',
        elements: ['descriptive language', 'emotional words', 'varied sentence structure', 'creative metaphors']
      },
      persuasive: {
        description: 'Convincing language designed to influence decisions and drive action',
        elements: ['strong arguments', 'emotional appeals', 'call-to-action', 'benefit-focused']
      },
      technical: {
        description: 'Precise, clear communication focused on accuracy and comprehensibility',
        elements: ['precise terminology', 'logical structure', 'step-by-step format', 'objective tone']
      },
      empathetic: {
        description: 'Understanding, supportive communication that acknowledges emotions and concerns',
        elements: ['emotional intelligence', 'validating language', 'supportive phrases', 'personal connection']
      }
    };
  }

  initializePersonaProfiles() {
    return {
      academic: {
        style: 'Formal, research-oriented',
        vocabulary: 'Advanced, discipline-specific',
        useCases: ['research papers', 'essays', 'academic correspondence'],
        traits: ['evidence-based', 'analytical', 'objective', 'thorough']
      },
      business: {
        style: 'Professional, goal-oriented',
        vocabulary: 'Business terminology, accessible',
        useCases: ['emails', 'reports', 'proposals', 'presentations'],
        traits: ['results-focused', 'efficient', 'collaborative', 'strategic']
      },
      creative: {
        style: 'Expressive, imaginative',
        vocabulary: 'Varied, descriptive',
        useCases: ['stories', 'creative content', 'artistic expression'],
        traits: ['innovative', 'emotional', 'vivid', 'engaging']
      },
      technical: {
        style: 'Precise, instructional',
        vocabulary: 'Technical, specific',
        useCases: ['documentation', 'manuals', 'guides', 'specifications'],
        traits: ['accurate', 'logical', 'comprehensive', 'user-focused']
      },
      marketing: {
        style: 'Persuasive, engaging',
        vocabulary: 'Benefit-focused, emotional',
        useCases: ['ad copy', 'product descriptions', 'promotional content'],
        traits: ['persuasive', 'customer-focused', 'action-oriented', 'compelling']
      },
      social: {
        style: 'Casual, conversational',
        vocabulary: 'Everyday, relatable',
        useCases: ['social media', 'casual posts', 'comments', 'personal communication'],
        traits: ['relatable', 'authentic', 'engaging', 'timely']
      }
    };
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GeminiAPIService;
} else if (typeof window !== 'undefined') {
  window.GeminiAPIService = GeminiAPIService;
}