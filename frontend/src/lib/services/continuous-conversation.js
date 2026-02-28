import { voice } from '../stores/voice.js';
import { settings } from '../stores/settings.js';
import * as recognition from './speech-recognition.js';
import * as synthesis from './speech-synthesis.js';

class ContinuousConversation {
  constructor() {
    this.isSpacePressed = false;
    this.isAIResponding = false;
    this.isContinuousMode = false;
    this.speechQueue = [];
    this.isSpeaking = false;
    this.interruptThreshold = 0.3; // Volume threshold for interruption detection
    this.interruptionTimeout = null;
    this.pushToTalkKey = ' '; // Spacebar
  }

  // Initialize continuous conversation mode
  async start() {
    if (this.isContinuousMode) return;
    
    this.isContinuousMode = true;
    
    try {
      // Start continuous voice recognition
      await recognition.start(
        (text) => this.handleVoiceInput(text),
        (error) => this.handleVoiceError(error),
        settings.get()?.language || 'en-US'
      );
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      this.isContinuousMode = false;
      return;
    }

    // Add keyboard listeners for push-to-talk
    this.addKeyboardListeners();
    
    // Add volume monitoring for interruption detection
    this.addInterruptionDetection();
  }

  // Stop continuous conversation mode
  stop() {
    this.isContinuousMode = false;
    this.isSpacePressed = false;
    this.isAIResponding = false;
    
    recognition.stop();
    this.removeKeyboardListeners();
    this.removeInterruptionDetection();
    this.clearInterruptionTimeout();
  }

  // Handle voice input from recognition
  handleVoiceInput(text) {
    if (!text.trim() || !this.isContinuousMode) return;

    console.log('Voice input detected:', text); // Debug log

    // If AI is responding and we detect speech, interrupt it
    if (this.isAIResponding) {
      console.log('Interrupting AI response');
      this.interruptAIResponse();
    }

    // Send message to AI
    this.onUserMessage?.(text.trim());
  }

  // Handle voice recognition errors
  handleVoiceError(error) {
    console.warn('Voice recognition error:', error);
    if (this.isContinuousMode) {
      // Auto-restart continuous mode on errors
      setTimeout(() => {
        if (this.isContinuousMode) {
          this.start();
        }
      }, 1000);
    }
  }

  // Add keyboard listeners for push-to-talk
  addKeyboardListeners() {
    this.keyDownHandler = (e) => {
      if (e.key === this.pushToTalkKey && !e.repeat) {
        this.isSpacePressed = true;
        voice.setListening(true);
        e.preventDefault();
      }
    };

    this.keyUpHandler = (e) => {
      if (e.key === this.pushToTalkKey) {
        this.isSpacePressed = false;
        // Don't stop listening in continuous mode
        // Just indicate push-to-talk is not active
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', this.keyDownHandler);
    window.addEventListener('keyup', this.keyUpHandler);
  }

  // Remove keyboard listeners
  removeKeyboardListeners() {
    if (this.keyDownHandler) {
      window.removeEventListener('keydown', this.keyDownHandler);
      this.keyDownHandler = null;
    }
    if (this.keyUpHandler) {
      window.removeEventListener('keyup', this.keyUpHandler);
      this.keyUpHandler = null;
    }
  }

  // Add interruption detection based on audio volume
  addInterruptionDetection() {
    // Monitor voice store for volume changes
    this.unsubscribe = voice.subscribe((state) => {
      if (this.isAIResponding && state.volume > this.interruptThreshold) {
        this.handleInterruption();
      }
    });
  }

  // Remove interruption detection
  removeInterruptionDetection() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  // Handle interruption detection
  handleInterruption() {
    // Debounce interruption detection
    if (this.interruptionTimeout) {
      clearTimeout(this.interruptionTimeout);
    }

    this.interruptionTimeout = setTimeout(() => {
      if (this.isAIResponding) {
        this.interruptAIResponse();
      }
    }, 300); // 300ms debounce
  }

  // Clear interruption timeout
  clearInterruptionTimeout() {
    if (this.interruptionTimeout) {
      clearTimeout(this.interruptionTimeout);
      this.interruptionTimeout = null;
    }
  }

  // Interrupt AI response
  interruptAIResponse() {
    console.log('Interrupting AI response...');
    this.clearInterruptionTimeout();
    synthesis.stop(); // Stop current speech
    this.isAIResponding = false;
    this.speechQueue = [];
    this.isSpeaking = false;
    
    // Optional: Send interruption signal to backend
    this.onInterruption?.();
  }

  // AI starts responding
  startAIResponse() {
    this.isAIResponding = true;
    this.clearInterruptionTimeout();
  }

  // AI finishes responding
  endAIResponse() {
    this.isAIResponding = false;
    this.clearInterruptionTimeout();
  }

  // Queue speech for natural conversation flow
  queueSpeech(text) {
    if (!text.trim()) return;
    
    this.speechQueue.push(text);
    if (!this.isSpeaking) {
      this.processSpeechQueue();
    }
  }

  // Process speech queue
  processSpeechQueue() {
    if (this.speechQueue.length === 0) {
      this.isSpeaking = false;
      return;
    }

    if (this.isAIResponding === false) {
      // If AI is no longer responding, clear queue
      this.speechQueue = [];
      this.isSpeaking = false;
      return;
    }

    this.isSpeaking = true;
    const text = this.speechQueue.shift();
    
    const currentSettings = settings.get();
    synthesis.speak(text, {
      rate: currentSettings?.speechRate ?? 0.95,
      pitch: currentSettings?.speechPitch ?? 0.85,
      volume: currentSettings?.speechVolume ?? 1.0,
      voiceName: currentSettings?.voiceName ?? '',
      lang: currentSettings?.language ?? 'en-US',
    });

    // Set up next speech when current one finishes
    setTimeout(() => {
      const checkSpeech = () => {
        if (!window.speechSynthesis.speaking) {
          this.isSpeaking = false;
          this.processSpeechQueue();
        } else {
          setTimeout(checkSpeech, 100);
        }
      };
      setTimeout(checkSpeech, 300);
    }, 100);
  }

  // Set callback for user messages
  onUserMessage(callback) {
    this.onUserMessage = callback;
  }

  // Set callback for interruption events
  onInterruption(callback) {
    this.onInterruption = callback;
  }

  // Check if currently in continuous mode
  isActive() {
    return this.isContinuousMode;
  }

  // Check if push-to-talk is active
  isPushToTalkActive() {
    return this.isSpacePressed;
  }
}

// Export singleton instance
export const continuousConversation = new ContinuousConversation();