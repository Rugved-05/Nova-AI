import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory for storing user profiles
const DATA_DIR = path.join(__dirname, '../../../data/ml');
const PROFILE_FILE = path.join(DATA_DIR, 'user-profiles.json');

// Ensure data directory exists
await fs.mkdir(DATA_DIR, { recursive: true });

class UserProfileService {
  constructor() {
    this.profiles = new Map();
    this.loadProfiles();
  }

  async loadProfiles() {
    try {
      const data = await fs.readFile(PROFILE_FILE, 'utf8');
      const profiles = JSON.parse(data);
      Object.entries(profiles).forEach(([userId, profile]) => {
        this.profiles.set(userId, profile);
      });
    } catch (error) {
      // File doesn't exist yet, create empty profiles
      this.profiles.set('default', this.createDefaultProfile());
    }
  }

  async saveProfiles() {
    const profilesObj = Object.fromEntries(this.profiles);
    await fs.writeFile(PROFILE_FILE, JSON.stringify(profilesObj, null, 2));
  }

  createDefaultProfile() {
    return {
      id: 'default',
      preferences: {
        conversationStyle: 'casual', // casual, formal, professional
        topicsOfInterest: [],
        favoriteTopics: [],
        dislikedTopics: [],
        responseLength: 'medium', // short, medium, long
        tonePreference: 'friendly', // friendly, professional, humorous
      },
      behaviorPatterns: {
        interactionTimes: [], // Timestamps of interactions
        responsePreferences: {
          speed: 'normal', // slow, normal, fast
          detailLevel: 'balanced', // low, balanced, high
        },
        frequentlyAskedQuestions: [],
        commonRequests: [],
      },
      voiceCharacteristics: {
        // Will be populated with voice analysis data
        speakingPattern: {},
        preferredInteractionStyle: 'conversational',
      },
      memory: {
        personalFacts: {}, // Personal information user shares
        conversationHistory: [],
        learnedPreferences: {},
        importantDates: [],
      },
      learningMetrics: {
        adaptationScore: 0,
        interactionCount: 0,
        satisfactionRating: 0,
        preferenceAccuracy: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  getProfile(userId = 'default') {
    if (!this.profiles.has(userId)) {
      this.profiles.set(userId, this.createDefaultProfile());
      this.saveProfiles();
    }
    return this.profiles.get(userId);
  }

  async updateProfile(userId, updates) {
    const profile = this.getProfile(userId);
    this.mergeDeep(profile, updates);
    profile.updatedAt = new Date().toISOString();
    await this.saveProfiles();
  }

  async updateLearningMetrics(userId, metrics) {
    const profile = this.getProfile(userId);
    profile.learningMetrics = { ...profile.learningMetrics, ...metrics };
    profile.updatedAt = new Date().toISOString();
    await this.saveProfiles();
  }

  async recordInteraction(userId, interactionData) {
    const profile = this.getProfile(userId);
    
    // Update behavior patterns
    profile.behaviorPatterns.interactionTimes.push(new Date().toISOString());
    
    // Record frequently asked questions
    if (interactionData.question) {
      const existingIndex = profile.behaviorPatterns.frequentlyAskedQuestions
        .findIndex(q => q.question === interactionData.question);
      
      if (existingIndex >= 0) {
        profile.behaviorPatterns.frequentlyAskedQuestions[existingIndex].count++;
      } else {
        profile.behaviorPatterns.frequentlyAskedQuestions.push({
          question: interactionData.question,
          count: 1,
          lastAsked: new Date().toISOString()
        });
      }
    }
    
    // Update interaction count
    profile.learningMetrics.interactionCount++;
    
    // Update memory with new information
    if (interactionData.memoryUpdate) {
      Object.assign(profile.memory.personalFacts, interactionData.memoryUpdate);
    }
    
    profile.updatedAt = new Date().toISOString();
    await this.saveProfiles();
  }

  mergeDeep(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        this.mergeDeep(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  getPersonalizationPrompt(userId = 'default') {
    const profile = this.getProfile(userId);
    
    let prompt = "";
    
    // Add preference-based instructions
    if (profile.preferences.tonePreference === 'humorous') {
      prompt += "Be more witty and add light humor to responses. ";
    } else if (profile.preferences.tonePreference === 'professional') {
      prompt += "Maintain a professional and formal tone. ";
    }
    
    if (profile.preferences.responseLength === 'short') {
      prompt += "Keep responses concise and to the point. ";
    } else if (profile.preferences.responseLength === 'long') {
      prompt += "Provide detailed explanations and comprehensive responses. ";
    }
    
    // Add personal facts
    const personalFacts = Object.entries(profile.memory.personalFacts);
    if (personalFacts.length > 0) {
      prompt += `User information: ${personalFacts.map(([key, value]) => `${key}: ${value}`).join(', ')}. `;
    }
    
    // Add favorite topics
    if (profile.preferences.favoriteTopics.length > 0) {
      prompt += `User enjoys discussing: ${profile.preferences.favoriteTopics.join(', ')}. `;
    }
    
    // Add frequently asked questions pattern
    const topQuestions = profile.behaviorPatterns.frequentlyAskedQuestions
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    
    if (topQuestions.length > 0) {
      prompt += `Commonly asked topics: ${topQuestions.map(q => q.question).join(', ')}. `;
    }
    
    return prompt.trim();
  }
}

export const userProfileService = new UserProfileService();