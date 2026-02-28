import { userProfileService } from './user-profile.js';

class ContextualMemoryService {
  constructor() {
    this.contextWindows = new Map(); // Store recent conversation context
    this.longTermMemory = new Map(); // Store important long-term memories
    this.conversationSummaries = new Map(); // Store summaries of conversations
  }

  async buildContext(userId, currentMessage, conversationId) {
    const profile = userProfileService.getProfile(userId);
    
    // Get recent context
    const recentContext = this.getContextWindow(userId, conversationId);
    
    // Get long-term memories
    const longTermMemories = this.getLongTermMemories(userId);
    
    // Get conversation history
    const conversationHistory = this.getConversationHistory(userId, conversationId);
    
    // Build comprehensive context
    const context = {
      recent: recentContext,
      longTerm: longTermMemories,
      conversationHistory: conversationHistory,
      userPreferences: profile.preferences,
      behavioralInsights: profile.behaviorPatterns,
      personalFacts: profile.memory.personalFacts,
      importantDates: profile.memory.importantDates,
      currentTopic: this.extractCurrentTopic(currentMessage),
      relatedTopics: this.findRelatedTopics(currentMessage, userId),
      emotionalState: this.estimateEmotionalState(recentContext),
    };
    
    return context;
  }

  getContextWindow(userId, conversationId) {
    const key = `${userId}:${conversationId}`;
    return this.contextWindows.get(key) || [];
  }

  addToContextWindow(userId, conversationId, message) {
    const key = `${userId}:${conversationId}`;
    if (!this.contextWindows.has(key)) {
      this.contextWindows.set(key, []);
    }
    
    const context = this.contextWindows.get(key);
    context.push({
      ...message,
      timestamp: new Date().toISOString(),
    });
    
    // Keep only recent context (last 10 messages)
    if (context.length > 10) {
      context.shift();
    }
    
    this.contextWindows.set(key, context);
  }

  getLongTermMemories(userId) {
    return this.longTermMemory.get(userId) || [];
  }

  storeLongTermMemory(userId, memory) {
    if (!this.longTermMemory.has(userId)) {
      this.longTermMemory.set(userId, []);
    }
    
    const memories = this.longTermMemory.get(userId);
    memories.push({
      ...memory,
      timestamp: new Date().toISOString(),
      importance: memory.importance || 'medium',
      category: memory.category || 'general',
    });
    
    // Keep only important memories (could be enhanced with forgetting algorithms)
    this.longTermMemory.set(userId, memories.slice(-50)); // Keep last 50 memories
  }

  getConversationHistory(userId, conversationId) {
    const profile = userProfileService.getProfile(userId);
    return profile.memory.conversationHistory.filter(conv => 
      !conversationId || conv.conversationId === conversationId
    ).slice(-20); // Last 20 conversations
  }

  async updateMemory(userId, conversationId, interactionData) {
    // Add to context window
    this.addToContextWindow(userId, conversationId, {
      role: 'user',
      content: interactionData.question,
      timestamp: new Date().toISOString(),
    });
    
    this.addToContextWindow(userId, conversationId, {
      role: 'assistant',
      content: interactionData.response,
      timestamp: new Date().toISOString(),
    });
    
    // Extract and store important information
    await this.extractImportantInformation(userId, interactionData);
    
    // Update conversation history in profile
    const profile = userProfileService.getProfile(userId);
    const conversationHistory = [...(profile.memory.conversationHistory || [])];
    
    const existingConvIndex = conversationHistory.findIndex(
      conv => conv.conversationId === conversationId
    );
    
    if (existingConvIndex >= 0) {
      conversationHistory[existingConvIndex].interactions.push({
        question: interactionData.question,
        response: interactionData.response,
        timestamp: new Date().toISOString(),
      });
    } else {
      conversationHistory.push({
        conversationId,
        interactions: [{
          question: interactionData.question,
          response: interactionData.response,
          timestamp: new Date().toISOString(),
        }],
        createdAt: new Date().toISOString(),
      });
    }
    
    // Keep only recent conversations
    if (conversationHistory.length > 100) {
      conversationHistory.shift();
    }
    
    await userProfileService.updateProfile(userId, {
      memory: {
        ...profile.memory,
        conversationHistory,
      }
    });
  }

  async extractImportantInformation(userId, interactionData) {
    const text = interactionData.question + ' ' + (interactionData.response || '');
    
    // Extract personal facts
    const personalFacts = this.extractPersonalFacts(text);
    if (Object.keys(personalFacts).length > 0) {
      await userProfileService.updateProfile(userId, {
        memory: {
          personalFacts: {
            ...userProfileService.getProfile(userId).memory.personalFacts,
            ...personalFacts
          }
        }
      });
    }
    
    // Extract important dates
    const dates = this.extractImportantDates(text);
    if (dates.length > 0) {
      const profile = userProfileService.getProfile(userId);
      const importantDates = [...profile.memory.importantDates];
      dates.forEach(date => {
        if (!importantDates.some(d => d.date === date.date)) {
          importantDates.push(date);
        }
      });
      
      await userProfileService.updateProfile(userId, {
        memory: {
          importantDates
        }
      });
    }
    
    // Identify important topics to remember
    const importantTopics = this.identifyImportantTopics(interactionData);
    if (importantTopics.length > 0) {
      importantTopics.forEach(topic => {
        this.storeLongTermMemory(userId, {
          type: 'topic_interest',
          content: topic,
          category: 'interests',
          importance: 'high',
        });
      });
    }
  }

  extractPersonalFacts(text) {
    const facts = {};
    
    // Extract name patterns
    const nameRegex = /\b(?:my name is|i am|i'm|call me)\s+([A-Za-z\s]+)/gi;
    let match;
    while ((match = nameRegex.exec(text)) !== null) {
      facts.name = match[1].trim();
    }
    
    // Extract location patterns
    const locationRegex = /\b(?:i live in|i'm from|i am from)\s+([A-Za-z\s,]+)/gi;
    while ((match = locationRegex.exec(text)) !== null) {
      facts.location = match[1].trim();
    }
    
    // Extract profession patterns
    const jobRegex = /\b(?:i work as|i am a|i'm a)\s+([A-Za-z\s]+)/gi;
    while ((match = jobRegex.exec(text)) !== null) {
      facts.profession = match[1].trim();
    }
    
    // Extract age patterns
    const ageRegex = /\b(?:i am|i'm)\s+(\d+)\s+(?:years old|old)\b/gi;
    while ((match = ageRegex.exec(text)) !== null) {
      facts.age = parseInt(match[1]);
    }
    
    // Extract interests
    const interestRegex = /\b(?:i like|i love|my favorite|interested in)\s+([A-Za-z\s]+)/gi;
    while ((match = interestRegex.exec(text)) !== null) {
      const interest = match[1].trim();
      if (!facts.interests) facts.interests = [];
      facts.interests.push(interest);
    }
    
    return facts;
  }

  extractImportantDates(text) {
    const dates = [];
    
    // Extract birthday patterns
    const birthdayRegex = /\b(?:my birthday is|born on|birthday)\s+(.+?)\b/gi;
    let match;
    while ((match = birthdayRegex.exec(text)) !== null) {
      dates.push({
        type: 'birthday',
        date: match[1].trim(),
        description: 'Birthday'
      });
    }
    
    // Extract anniversary patterns
    const anniversaryRegex = /\b(?:anniversary|wedding date)\s+(.+?)\b/gi;
    while ((match = anniversaryRegex.exec(text)) !== null) {
      dates.push({
        type: 'anniversary',
        date: match[1].trim(),
        description: 'Anniversary'
      });
    }
    
    return dates;
  }

  identifyImportantTopics(interactionData) {
    const topics = [];
    const text = interactionData.question + ' ' + (interactionData.response || '');
    
    // Identify frequently mentioned topics
    const commonTopics = [
      { pattern: /technology|software|programming|coding/i, topic: 'technology' },
      { pattern: /health|fitness|exercise|diet/i, topic: 'health' },
      { pattern: /travel|vacation|trip|destination/i, topic: 'travel' },
      { pattern: /cooking|recipe|food|meal/i, topic: 'food' },
      { pattern: /finance|money|investment|budget/i, topic: 'finance' },
      { pattern: /sports|game|football|basketball/i, topic: 'sports' },
      { pattern: /music|song|artist|band/i, topic: 'music' },
      { pattern: /movie|film|cinema|actor/i, topic: 'movies' },
    ];
    
    commonTopics.forEach(({ pattern, topic }) => {
      if (pattern.test(text)) {
        topics.push(topic);
      }
    });
    
    return topics;
  }

  extractCurrentTopic(message) {
    // Simple topic extraction - could be enhanced with NLP
    const topics = [
      'technology', 'science', 'news', 'sports', 'music', 'movies', 'books',
      'travel', 'food', 'health', 'education', 'business', 'politics', 'weather',
      'work', 'family', 'friends', 'hobbies', 'programming', 'ai', 'learning'
    ];
    
    const lowerText = (message || '').toLowerCase();
    return topics.find(topic => lowerText.includes(topic)) || 'general';
  }

  findRelatedTopics(message, userId) {
    const profile = userProfileService.getProfile(userId);
    const currentTopic = this.extractCurrentTopic(message);
    const related = [];
    
    // Find topics related to user's interests
    const userInterests = profile.preferences.favoriteTopics || [];
    userInterests.forEach(interest => {
      if (interest.toLowerCase().includes(currentTopic) || 
          currentTopic.toLowerCase().includes(interest)) {
        related.push(interest);
      }
    });
    
    return related.slice(0, 3);
  }

  estimateEmotionalState(context) {
    if (!context || context.length === 0) return 'neutral';
    
    const recentMessages = context.slice(-3); // Last 3 messages
    const text = recentMessages.map(m => m.content || '').join(' ').toLowerCase();
    
    // Simple emotion detection
    const positiveWords = ['happy', 'good', 'great', 'love', 'amazing', 'wonderful', 'excellent'];
    const negativeWords = ['sad', 'bad', 'terrible', 'hate', 'awful', 'horrible', 'disappointed'];
    const urgentWords = ['urgent', 'important', 'need', 'must', 'quickly', 'fast'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    let urgentCount = 0;
    
    positiveWords.forEach(word => {
      if (text.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (text.includes(word)) negativeCount++;
    });
    
    urgentWords.forEach(word => {
      if (text.includes(word)) urgentCount++;
    });
    
    if (urgentCount > 0) return 'urgent';
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  async getMemorySummary(userId) {
    const profile = userProfileService.getProfile(userId);
    const context = this.getContextWindow(userId, 'default');
    
    return {
      personalFacts: Object.keys(profile.memory.personalFacts).length,
      conversationCount: profile.memory.conversationHistory.length,
      importantDates: profile.memory.importantDates.length,
      recentContextItems: context.length,
      longTermMemories: this.getLongTermMemories(userId).length,
      emotionalTrend: this.getEmotionalTrend(context),
    };
  }

  getEmotionalTrend(context) {
    if (context.length < 2) return 'stable';
    
    const emotions = context.map(item => this.estimateEmotionalState([item]));
    const last = emotions[emotions.length - 1];
    const prev = emotions[emotions.length - 2];
    
    if (last !== prev) return 'changing';
    return 'stable';
  }

  clearContext(userId, conversationId) {
    const key = `${userId}:${conversationId}`;
    this.contextWindows.delete(key);
  }
}

export const contextualMemoryService = new ContextualMemoryService();