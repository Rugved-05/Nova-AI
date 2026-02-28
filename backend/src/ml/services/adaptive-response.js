import { userProfileService } from './user-profile.js';
import { behavioralAnalysisService } from './behavioral-analysis.js';
import { contextualMemoryService } from './contextual-memory.js';

class AdaptiveResponseService {
  constructor() {
    this.responseTemplates = new Map();
    this.personalizationWeights = new Map();
  }

  async generateAdaptiveResponse(userId, conversationId, originalResponse, originalContext) {
    const profile = userProfileService.getProfile(userId);
    const context = await contextualMemoryService.buildContext(userId, originalResponse, conversationId);
    
    // Apply personalization based on user profile
    let adaptiveResponse = originalResponse;
    
    // Adjust tone based on user preference
    adaptiveResponse = this.adjustTone(adaptiveResponse, profile.preferences.tonePreference);
    
    // Adjust length based on user preference
    adaptiveResponse = this.adjustLength(adaptiveResponse, profile.preferences.responseLength);
    
    // Incorporate personal facts
    adaptiveResponse = this.incorporatePersonalFacts(adaptiveResponse, profile.memory.personalFacts);
    
    // Add relevant context from memory
    adaptiveResponse = this.addRelevantContext(adaptiveResponse, context);
    
    // Apply behavioral adaptations
    adaptiveResponse = await this.applyBehavioralAdaptations(adaptiveResponse, userId, context);
    
    return adaptiveResponse;
  }

  adjustTone(response, tonePreference) {
    switch (tonePreference) {
      case 'humorous':
        return this.makeMoreHumorous(response);
      case 'professional':
        return this.makeMoreProfessional(response);
      case 'friendly':
      default:
        return response; // Already friendly
    }
  }

  makeMoreHumorous(response) {
    // Add light humor based on content
    const humorPatterns = [
      { pattern: /(?:information|details|fact)/gi, replacement: "fun fact" },
      { pattern: /(?:process|procedure)/gi, replacement: "cool process" },
      { pattern: /(?:algorithm|calculation)/gi, replacement: "smart algorithm" },
    ];
    
    let modifiedResponse = response;
    humorPatterns.forEach(({ pattern, replacement }) => {
      modifiedResponse = modifiedResponse.replace(pattern, replacement);
    });
    
    // Add occasional light-hearted remarks
    const humorInsertions = [
      "Just saying! 😊",
      "Hope that makes sense!",
      "Let me know if that helps!",
      "Pretty neat, right?",
    ];
    
    if (Math.random() > 0.7) { // 30% chance to add humor
      modifiedResponse += " " + humorInsertions[Math.floor(Math.random() * humorInsertions.length)];
    }
    
    return modifiedResponse;
  }

  makeMoreProfessional(response) {
    // Make language more formal and structured
    const professionalTerms = [
      { pattern: /\bgonna\b/gi, replacement: "will be" },
      { pattern: /\bwanna\b/gi, replacement: "would like to" },
      { pattern: /\bcoulda\b/gi, replacement: "could have" },
      { pattern: /\bshoulda\b/gi, replacement: "should have" },
      { pattern: /\bhowdy\b/gi, replacement: "Greetings" },
    ];
    
    let modifiedResponse = response;
    professionalTerms.forEach(({ pattern, replacement }) => {
      modifiedResponse = modifiedResponse.replace(pattern, replacement);
    });
    
    // Add professional closing
    if (!modifiedResponse.endsWith('.') && !modifiedResponse.endsWith('!') && !modifiedResponse.endsWith('?')) {
      modifiedResponse += '.';
    }
    
    return modifiedResponse;
  }

  adjustLength(response, lengthPreference) {
    const wordCount = response.split(/\s+/).length;
    
    switch (lengthPreference) {
      case 'short':
        if (wordCount > 50) {
          // Truncate to first few sentences
          const sentences = response.match(/[^.!?]+[.!?]+/g) || [response];
          return (sentences[0] || response.substring(0, 100) + '...').trim();
        }
        return response;
        
      case 'long':
        if (wordCount < 100) {
          // Add more detail if possible
          return response + " Additionally, this topic is quite interesting and has many facets worth exploring in greater detail.";
        }
        return response;
        
      case 'medium':
      default:
        if (wordCount > 150) {
          // Moderate truncation
          const sentences = response.match(/[^.!?]+[.!?]+/g) || [response];
          let result = '';
          for (let i = 0; i < sentences.length && result.split(/\s+/).length < 100; i++) {
            result += sentences[i];
          }
          return result.trim() || response.substring(0, 200) + '...';
        }
        return response;
    }
  }

  incorporatePersonalFacts(response, personalFacts) {
    if (!personalFacts || Object.keys(personalFacts).length === 0) {
      return response;
    }
    
    let modifiedResponse = response;
    
    // Add personal touches based on known facts
    if (personalFacts.name) {
      modifiedResponse = `Hi ${personalFacts.name}! ${modifiedResponse}`;
    }
    
    if (personalFacts.location && response.toLowerCase().includes('weather')) {
      modifiedResponse = modifiedResponse.replace(/(?:the )?weather/gi, `weather in ${personalFacts.location}`);
    }
    
    if (personalFacts.interests && personalFacts.interests.length > 0) {
      const relevantInterest = personalFacts.interests.find(interest => 
        response.toLowerCase().includes(interest.toLowerCase())
      );
      
      if (relevantInterest) {
        modifiedResponse += ` Since you're interested in ${relevantInterest}, this might be particularly relevant for you.`;
      }
    }
    
    return modifiedResponse;
  }

  addRelevantContext(response, context) {
    if (!context.relatedTopics || context.relatedTopics.length === 0) {
      return response;
    }
    
    // Add related topic suggestions if relevant
    const relatedTopic = context.relatedTopics[0];
    if (relatedTopic && Math.random() > 0.6) { // 40% chance to add related topic
      return response + ` By the way, you might also be interested in ${relatedTopic} on this subject.`;
    }
    
    return response;
  }

  async applyBehavioralAdaptations(response, userId, context) {
    const insights = await behavioralAnalysisService.getPersonalizationInsights(userId);
    
    let modifiedResponse = response;
    
    // Adjust based on engagement level
    if (insights.engagementScore < 50) {
      // For newer users, be more encouraging
      modifiedResponse += " I hope this helps! Feel free to ask more questions about this topic.";
    } else if (insights.engagementScore > 80) {
      // For engaged users, be more concise and assume more knowledge
      modifiedResponse = modifiedResponse.replace(/(?:as you might know|you probably know)/gi, "As you know");
    }
    
    // Adjust based on emotional state
    if (context.emotionalState === 'urgent') {
      modifiedResponse = `Got it! ${modifiedResponse}`;
    } else if (context.emotionalState === 'negative') {
      modifiedResponse = `I understand. ${modifiedResponse}`;
    }
    
    return modifiedResponse;
  }

  async getResponseSuggestions(userId, currentQuery) {
    const profile = userProfileService.getProfile(userId);
    const context = await contextualMemoryService.buildContext(userId, currentQuery, 'temp');
    
    const suggestions = [];
    
    // Suggest follow-up questions based on conversation patterns
    if (profile.behaviorPatterns.frequentlyAskedQuestions.length > 0) {
      const topQuestions = profile.behaviorPatterns.frequentlyAskedQuestions
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      
      topQuestions.forEach(q => {
        if (currentQuery.toLowerCase().includes(q.question.toLowerCase())) {
          suggestions.push(`Would you like to know more about ${q.question}?`);
        }
      });
    }
    
    // Suggest based on favorite topics
    if (profile.preferences.favoriteTopics.length > 0) {
      profile.preferences.favoriteTopics.forEach(topic => {
        if (currentQuery.toLowerCase().includes(topic.toLowerCase())) {
          suggestions.push(`I know you enjoy ${topic}. Here's what I think:`);
        }
      });
    }
    
    // Suggest based on personal facts
    if (Object.keys(profile.memory.personalFacts).length > 0) {
      Object.entries(profile.memory.personalFacts).forEach(([key, value]) => {
        if (currentQuery.toLowerCase().includes(key.toLowerCase())) {
          suggestions.push(`Based on what I know about you (${key}: ${value}), I think:`);
        }
      });
    }
    
    return suggestions.slice(0, 2); // Return top 2 suggestions
  }

  async updateResponseEffectiveness(userId, response, userFeedback) {
    const profile = userProfileService.getProfile(userId);
    
    // Update learning metrics based on feedback
    const effectiveness = this.calculateResponseEffectiveness(response, userFeedback);
    
    await userProfileService.updateLearningMetrics(userId, {
      satisfactionRating: effectiveness.satisfaction,
      preferenceAccuracy: effectiveness.accuracy,
    });
    
    return effectiveness;
  }

  calculateResponseEffectiveness(response, feedback) {
    // Simple effectiveness calculation
    const satisfaction = feedback.rating || 3; // Default to neutral rating
    
    // Calculate how well the response matched user preferences
    const lengthMatch = this.evaluateLengthMatch(response, feedback.expectedLength);
    const toneMatch = this.evaluateToneMatch(response, feedback.expectedTone);
    
    const accuracy = (lengthMatch + toneMatch) / 2;
    
    return {
      satisfaction,
      accuracy,
      lengthMatch,
      toneMatch,
    };
  }

  evaluateLengthMatch(response, expectedLength) {
    const wordCount = response.split(/\s+/).length;
    
    switch (expectedLength) {
      case 'short':
        return wordCount <= 50 ? 1 : wordCount <= 100 ? 0.7 : 0.3;
      case 'long':
        return wordCount >= 100 ? 1 : wordCount >= 50 ? 0.7 : 0.3;
      case 'medium':
      default:
        return wordCount >= 50 && wordCount <= 100 ? 1 : 0.6;
    }
  }

  evaluateToneMatch(response, expectedTone) {
    const responseLower = response.toLowerCase();
    
    switch (expectedTone) {
      case 'humorous':
        const humorIndicators = ['fun', 'interesting', 'neat', 'cool', '!', ':)'];
        return humorIndicators.some(indicator => responseLower.includes(indicator)) ? 1 : 0.4;
      case 'professional':
        const professionalIndicators = ['additionally', 'furthermore', 'additionally', 'respectfully'];
        return professionalIndicators.some(indicator => responseLower.includes(indicator)) ? 1 : 0.4;
      case 'friendly':
      default:
        const friendlyIndicators = ['hope', 'feel free', 'let me know', 'hi', 'hello'];
        return friendlyIndicators.some(indicator => responseLower.includes(indicator)) ? 1 : 0.6;
    }
  }

  async getPersonalizationReport(userId) {
    const profile = userProfileService.getProfile(userId);
    const insights = await behavioralAnalysisService.getPersonalizationInsights(userId);
    
    return {
      adaptationLevel: insights.adaptationLevel,
      engagementScore: insights.engagementScore,
      personalizationStrength: insights.personalizationStrength,
      learningProgress: profile.learningMetrics.interactionCount,
      preferenceAccuracy: profile.learningMetrics.preferenceAccuracy,
      suggestedImprovements: insights.suggestedImprovements,
      behavioralPatterns: {
        peakActivityTime: profile.behaviorPatterns.timePatterns?.peakActivityHour,
        preferredTopics: profile.preferences.favoriteTopics,
        responsePreferences: profile.behaviorPatterns.responsePreferences,
        interactionStyle: profile.behaviorPatterns.interactionStyle,
      },
    };
  }
}

export const adaptiveResponseService = new AdaptiveResponseService();