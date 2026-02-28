import { conversation } from '../stores/conversation.js';
import { settings } from '../stores/settings.js';
import { voice } from '../stores/voice.js';

class JarvisProactiveService {
  constructor() {
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.lastInteractionTime = Date.now();
    this.systemChecks = [];
    this.notifications = [];
    this.adviceQueue = [];
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.lastInteractionTime = Date.now();
    
    // Start periodic system checks
    this.monitoringInterval = setInterval(() => {
      this.performSystemCheck();
      this.checkForNotifications();
      this.offerProactiveAssistance();
    }, 30000); // Every 30 seconds
    
    // Monitor user interactions
    this.setupInteractionMonitoring();
  }

  stopMonitoring() {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  setupInteractionMonitoring() {
    // Monitor conversation store for interactions
    this.conversationUnsubscribe = conversation.subscribe((state) => {
      if (state.messages.length > 0) {
        this.lastInteractionTime = Date.now();
      }
    });
    
    // Monitor voice activity
    this.voiceUnsubscribe = voice.subscribe((state) => {
      if (state.isListening || state.isSpeaking) {
        this.lastInteractionTime = Date.now();
      }
    });
  }

  performSystemCheck() {
    const now = Date.now();
    const timeSinceLastInteraction = now - this.lastInteractionTime;
    
    // Check if user has been inactive for a while
    if (timeSinceLastInteraction > 300000) { // 5 minutes
      this.offerIdleAssistance();
    }
    
    // Check time of day for relevant suggestions
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      this.offerMorningGreeting();
    } else if (hour >= 12 && hour < 17) {
      this.offerAfternoonUpdate();
    } else if (hour >= 17 && hour < 22) {
      this.offerEveningBriefing();
    } else {
      this.offerNightlyStatus();
    }
    
    // Check for important daily tasks
    this.checkDailyReminders();
  }

  checkForNotifications() {
    // Check for system notifications that need attention
    const notifications = [];
    
    // Example: Check for pending updates, maintenance, etc.
    if (Math.random() > 0.95) { // Random check for demo purposes
      notifications.push({
        type: 'system',
        priority: 'low',
        message: 'System maintenance scheduled for tonight',
        timestamp: Date.now()
      });
    }
    
    this.notifications = [...this.notifications, ...notifications];
  }

  offerProactiveAssistance() {
    const now = Date.now();
    const timeSinceLastInteraction = now - this.lastInteractionTime;
    
    if (timeSinceLastInteraction < 10000) return; // Less than 10 seconds since last interaction
    
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    // Offer different types of assistance based on context
    if (timeSinceLastInteraction > 120000) { // 2 minutes
      this.offerIdleSuggestions();
    }
    
    // Morning coffee reminder
    if (hour === 8 && Math.random() > 0.7) {
      this.addAdvice('Sir, would you like me to prepare your morning briefing?');
    }
    
    // Evening reminder
    if (hour === 18 && Math.random() > 0.7) {
      this.addAdvice('Sir, shall I prepare tomorrow\'s schedule overview?');
    }
  }

  offerIdleAssistance() {
    const idleTime = Date.now() - this.lastInteractionTime;
    
    if (idleTime > 600000) { // 10 minutes
      this.addAdvice('Sir, I notice you\'ve been inactive. Shall I put the system in standby mode?');
    } else if (idleTime > 300000) { // 5 minutes
      this.addAdvice('Sir, would you like a status update on any ongoing processes?');
    }
  }

  offerMorningGreeting() {
    if (Math.random() > 0.8) { // 20% chance
      this.addAdvice('Good morning, sir. The weather is favorable for your commute. Traffic should be light.');
    }
  }

  offerAfternoonUpdate() {
    if (Math.random() > 0.8) { // 20% chance
      this.addAdvice('Good afternoon, sir. I\'ve optimized your system performance and cleared temporary files.');
    }
  }

  offerEveningBriefing() {
    if (Math.random() > 0.8) { // 20% chance
      this.addAdvice('Good evening, sir. Shall I prepare tomorrow\'s agenda review?');
    }
  }

  offerNightlyStatus() {
    if (Math.random() > 0.8) { // 20% chance
      this.addAdvice('Good evening, sir. System security scan completed. All clear.');
    }
  }

  checkDailyReminders() {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    
    // Example reminders based on time/day
    if (hour === 9 && dayOfWeek === 1 && Math.random() > 0.7) { // Monday morning
      this.addAdvice('Sir, today is Monday. Shall I prioritize your weekly planning tasks?');
    }
    
    if (hour === 17 && dayOfWeek >= 1 && dayOfWeek <= 5 && Math.random() > 0.7) { // Weekday evening
      this.addAdvice('Sir, shall I prepare your commute information for departure?');
    }
  }

  offerIdleSuggestions() {
    const suggestions = [
      'Sir, would you like me to optimize system performance?',
      'Shall I check for any pending updates?',
      'Would you like a brief status report on system operations?',
      'Sir, I can adjust your desktop environment if you\'re taking a break.',
      'Shall I dim the screen to reduce eye strain?'
    ];
    
    if (Math.random() > 0.6) { // 40% chance
      const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
      this.addAdvice(suggestion);
    }
  }

  addAdvice(advice) {
    this.adviceQueue.push({
      id: Date.now(),
      message: advice,
      timestamp: Date.now(),
      priority: 'medium'
    });
    
    // Keep only recent advice
    if (this.adviceQueue.length > 5) {
      this.adviceQueue.shift();
    }
  }

  getRecentAdvice() {
    return this.adviceQueue.slice(-3); // Last 3 pieces of advice
  }

  getSystemStatus() {
    return {
      lastInteraction: this.lastInteractionTime,
      isMonitoring: this.isMonitoring,
      notificationCount: this.notifications.length,
      adviceQueueLength: this.adviceQueue.length,
      idleTime: Date.now() - this.lastInteractionTime,
      timeOfDay: this.getTimeOfDay(),
      dayOfWeek: new Date().getDay()
    };
  }

  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  triggerImmediateAssistance(type, params = {}) {
    switch (type) {
      case 'system_status':
        return 'Sir, system status: All systems operational. CPU usage at 23%, memory at 45%. No critical alerts.';
      case 'security_scan':
        return 'Security scan initiated. No threats detected. System remains secure.';
      case 'performance_optimize':
        return 'Performance optimization complete. System running at peak efficiency.';
      case 'schedule_review':
        return 'Reviewing your schedule... Upcoming meetings: 2 today, 1 tomorrow. Nothing urgent requires immediate attention.';
      case 'commute_info':
        return 'Traffic is light. Your usual route should take approximately 25 minutes.';
      default:
        return 'Sir, I\'m ready to assist. What would you like me to do?';
    }
  }
}

// Export singleton instance
export const jarvisProactiveService = new JarvisProactiveService();