import { userProfileService } from './user-profile.js';

class BehavioralAnalysisService {
  constructor() {
    this.patternDetectors = {
      timePatterns: this.detectTimePatterns,
      topicPreferences: this.detectTopicPreferences,
      responsePreferences: this.detectResponsePreferences,
      interactionStyle: this.detectInteractionStyle,
    };
  }

  async analyzeUserBehavior(userId, conversationData) {
    const profile = userProfileService.getProfile(userId);
    
    // Analyze various behavioral patterns
    const timeAnalysis = this.analyzeTimePatterns(profile.behaviorPatterns.interactionTimes);
    const topicAnalysis = this.analyzeTopicPreferences(conversationData);
    const responseAnalysis = this.analyzeResponsePreferences(conversationData);
    const styleAnalysis = this.analyzeInteractionStyle(conversationData);
    
    // Update profile with new insights
    const updates = {
      behaviorPatterns: {
        ...profile.behaviorPatterns,
        timePatterns: timeAnalysis,
        topicPreferences: topicAnalysis,
        responsePreferences: {
          ...profile.behaviorPatterns.responsePreferences,
          ...responseAnalysis
        },
        interactionStyle: styleAnalysis,
      },
      learningMetrics: {
        ...profile.learningMetrics,
        adaptationScore: this.calculateAdaptationScore(profile),
        preferenceAccuracy: this.calculatePreferenceAccuracy(profile),
      }
    };
    
    await userProfileService.updateProfile(userId, updates);
    
    return {
      timePatterns: timeAnalysis,
      topicPreferences: topicAnalysis,
      responsePreferences: responseAnalysis,
      interactionStyle: styleAnalysis,
    };
  }

  detectTimePatterns(interactionTimes) {
    if (!interactionTimes || interactionTimes.length === 0) return {};

    const hours = interactionTimes.map(time => new Date(time).getHours());
    const days = interactionTimes.map(time => new Date(time).getDay());
    
    // Count occurrences
    const hourCounts = {};
    const dayCounts = {};
    
    hours.forEach(hour => {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    days.forEach(day => {
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    
    // Find peak activity times
    const peakHour = Object.entries(hourCounts).reduce((a, b) => 
      a[1] > b[1] ? a : b)[0];
    const peakDay = Object.entries(dayCounts).reduce((a, b) => 
      a[1] > b[1] ? a : b)[0];
    
    return {
      peakActivityHour: parseInt(peakHour),
      peakActivityDay: parseInt(peakDay),
      preferredTimeRange: this.getTimeRange(parseInt(peakHour)),
      activityFrequency: hours.length / this.getDaysSinceFirstInteraction(interactionTimes),
    };
  }

  getTimeRange(hour) {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  getDaysSinceFirstInteraction(times) {
    if (times.length === 0) return 1;
    const first = new Date(times[0]);
    const last = new Date(times[times.length - 1]);
    return Math.max(1, Math.ceil((last - first) / (1000 * 60 * 60 * 24)));
  }

  detectTopicPreferences(conversationData) {
    if (!conversationData || !Array.isArray(conversationData)) return {};
    
    const topicScores = {};
    
    // Analyze conversation content for topic preferences
    conversationData.forEach(conversation => {
      const text = (conversation.question || '') + ' ' + (conversation.response || '');
      const topics = this.extractTopics(text);
      
      topics.forEach(topic => {
        topicScores[topic] = (topicScores[topic] || 0) + 1;
      });
    });
    
    // Sort by frequency
    const sortedTopics = Object.entries(topicScores)
      .sort(([,a], [,b]) => b - a)
      .map(([topic, score]) => ({ topic, score }));
    
    return {
      favoriteTopics: sortedTopics.slice(0, 5).map(t => t.topic),
      topicInterestLevels: Object.fromEntries(sortedTopics.map(t => [t.topic, t.score])),
      trendingTopics: this.getTrendingTopics(sortedTopics),
    };
  }

  extractTopics(text) {
    // Simple topic extraction - could be enhanced with NLP
    const commonTopics = [
      'technology', 'science', 'news', 'sports', 'music', 'movies', 'books',
      'travel', 'food', 'health', 'education', 'business', 'politics', 'weather',
      'work', 'family', 'friends', 'hobbies', 'programming', 'ai', 'learning'
    ];
    
    const lowerText = text.toLowerCase();
    return commonTopics.filter(topic => lowerText.includes(topic));
  }

  getTrendingTopics(topics) {
    // Return topics that appear frequently recently
    return topics.slice(0, 3).map(t => t.topic);
  }

  detectResponsePreferences(conversationData) {
    if (!conversationData || !Array.isArray(conversationData)) return {};
    
    const responseLengths = conversationData.map(conv => {
      const response = conv.response || '';
      return response.split(' ').length;
    });
    
    const avgLength = responseLengths.reduce((a, b) => a + b, 0) / responseLengths.length;
    
    let preferredLength = 'medium';
    if (avgLength < 20) preferredLength = 'short';
    else if (avgLength > 50) preferredLength = 'long';
    
    // Analyze user satisfaction with response lengths
    const satisfactionData = conversationData.filter(c => c.satisfactionRating);
    const avgSatisfaction = satisfactionData.length > 0 
      ? satisfactionData.reduce((sum, c) => sum + (c.satisfactionRating || 0), 0) / satisfactionData.length
      : 0;
    
    return {
      preferredLength,
      averageResponseLength: avgLength,
      satisfactionWithLength: avgSatisfaction,
      detailPreference: this.getDetailPreference(avgLength, avgSatisfaction),
    };
  }

  getDetailPreference(avgLength, satisfaction) {
    if (avgLength < 20 && satisfaction > 3) return 'concise';
    if (avgLength > 50 && satisfaction > 3) return 'detailed';
    return 'balanced';
  }

  detectInteractionStyle(conversationData) {
    if (!conversationData || !Array.isArray(conversationData)) return 'conversational';
    
    // Analyze conversation style based on question patterns
    const questionTypes = {
      factual: 0,
      opinion: 0,
      creative: 0,
      technical: 0,
      casual: 0,
    };
    
    conversationData.forEach(conv => {
      const question = conv.question || '';
      const lowerQ = question.toLowerCase();
      
      if (lowerQ.includes('what is') || lowerQ.includes('define') || lowerQ.includes('explain')) {
        questionTypes.factual++;
      } else if (lowerQ.includes('what do you think') || lowerQ.includes('opinion') || lowerQ.includes('should i')) {
        questionTypes.opinion++;
      } else if (lowerQ.includes('create') || lowerQ.includes('write') || lowerQ.includes('imagine')) {
        questionTypes.creative++;
      } else if (lowerQ.includes('how to') || lowerQ.includes('code') || lowerQ.includes('technical')) {
        questionTypes.technical++;
      } else if (lowerQ.includes('hey') || lowerQ.includes('hello') || lowerQ.includes('hi')) {
        questionTypes.casual++;
      }
    });
    
    // Find most common question type
    const mostCommon = Object.entries(questionTypes).reduce((a, b) => 
      a[1] > b[1] ? a : b)[0];
    
    return mostCommon;
  }

  calculateAdaptationScore(profile) {
    // Calculate how well the system adapts to user preferences
    const { learningMetrics, preferences, behaviorPatterns } = profile;
    const baseScore = learningMetrics.interactionCount * 0.1;
    const preferenceMatch = this.calculatePreferenceMatch(profile);
    
    return Math.min(10, baseScore + preferenceMatch);
  }

  calculatePreferenceMatch(profile) {
    // Simplified calculation - could be enhanced
    const { preferences, behaviorPatterns } = profile;
    let score = 0;
    
    // Match response length preference
    if (preferences.responseLength === 'short' && behaviorPatterns.responsePreferences.preferredLength === 'short') score += 1;
    if (preferences.responseLength === 'long' && behaviorPatterns.responsePreferences.preferredLength === 'long') score += 1;
    
    // Match tone preference
    if (preferences.tonePreference === 'friendly' && behaviorPatterns.interactionStyle === 'casual') score += 1;
    if (preferences.tonePreference === 'professional' && behaviorPatterns.interactionStyle === 'factual') score += 1;
    
    return score;
  }

  calculatePreferenceAccuracy(profile) {
    // Calculate accuracy of preference predictions
    const { learningMetrics, preferences } = profile;
    return Math.min(1, learningMetrics.satisfactionRating / 5) * 100;
  }

  async getPersonalizationInsights(userId) {
    const profile = userProfileService.getProfile(userId);
    const { learningMetrics, preferences, behaviorPatterns } = profile;
    
    return {
      adaptationLevel: this.getAdaptationLevel(learningMetrics.adaptationScore),
      engagementScore: this.calculateEngagementScore(learningMetrics),
      personalizationStrength: this.calculatePersonalizationStrength(profile),
      suggestedImprovements: this.getSuggestedImprovements(profile),
    };
  }

  getAdaptationLevel(score) {
    if (score < 2) return 'minimal';
    if (score < 5) return 'basic';
    if (score < 8) return 'good';
    return 'advanced';
  }

  calculateEngagementScore(metrics) {
    return Math.min(100, (metrics.interactionCount / 10) * 20 + metrics.satisfactionRating * 10);
  }

  calculatePersonalizationStrength(profile) {
    const { preferences, behaviorPatterns, memory } = profile;
    let strength = 0;
    
    // Count filled preference fields
    Object.values(preferences).forEach(p => {
      if (p && p.length > 0) strength += 10;
    });
    
    // Count behavioral data
    Object.values(behaviorPatterns).forEach(bp => {
      if (bp && typeof bp === 'object') {
        strength += Object.keys(bp).length;
      } else if (Array.isArray(bp)) {
        strength += bp.length * 2;
      }
    });
    
    // Count memory entries
    strength += Object.keys(memory.personalFacts).length * 5;
    
    return Math.min(100, strength);
  }

  getSuggestedImprovements(profile) {
    const suggestions = [];
    
    if (profile.behaviorPatterns.frequentlyAskedQuestions.length < 3) {
      suggestions.push("Ask more questions to help the AI learn your preferences");
    }
    
    if (Object.keys(profile.memory.personalFacts).length < 2) {
      suggestions.push("Share more personal information to enhance personalization");
    }
    
    if (profile.learningMetrics.interactionCount < 10) {
      suggestions.push("Continue using the AI to improve personalization");
    }
    
    return suggestions;
  }
}

export const behavioralAnalysisService = new BehavioralAnalysisService();