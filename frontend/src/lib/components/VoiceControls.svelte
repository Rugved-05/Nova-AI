<script>
  import { voice } from '../stores/voice.js';
  import { settings } from '../stores/settings.js';
  import * as speechRecognition from '../services/speech-recognition.js';
  import { continuousConversation } from '../services/continuous-conversation.js';

  export let onResult = () => {};
  export let disabled = false;

  function toggleListening() {
    if (disabled || continuousConversation.isActive()) return;
    
    if ($voice.isListening) {
      speechRecognition.stop();
    } else {
      speechRecognition.start(
        (text) => onResult(text),
        (err) => console.error('STT error:', err),
        $settings.language
      );
    }
  }
</script>

<div class="voice-controls">
  <!-- Continuous conversation indicator -->
  {#if continuousConversation.isActive()}
    <div class="continuous-indicator">
      <span class="indicator-dot"></span>
      <span class="indicator-text">
        {#if continuousConversation.isPushToTalkActive()}
          PUSH-TO-TALK ACTIVE (HOLD SPACE)
        {:else}
          CONTINUOUS LISTENING
        {/if}
      </span>
    </div>
  {/if}

  {#if $voice.interimTranscript}
    <div class="interim">
      <span class="interim-dot"></span>
      <span class="interim-text">{$voice.interimTranscript}</span>
    </div>
  {/if}

  <div class="controls-row">
    <button
      class="mic-button"
      class:listening={$voice.isListening}
      class:speaking={$voice.isSpeaking}
      class:disabled={disabled || continuousConversation.isActive()}
      on:click={toggleListening}
      title={continuousConversation.isActive() ? 'Continuous mode active - use spacebar' : ($voice.isListening ? 'Stop listening' : 'Start listening')}
    >
      <div class="mic-ring ring-1" class:active={$voice.isListening}></div>
      <div class="mic-ring ring-2" class:active={$voice.isListening}></div>
      <div class="mic-ring ring-3" class:active={$voice.isListening}></div>
      <div class="mic-inner">
        {#if $voice.isListening}
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        {:else if $voice.isSpeaking}
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        {/if}
      </div>
    </button>

    {#if $voice.isListening}
      <div class="listening-badge">
        <span class="pulse-dot"></span>
        ALWAYS LISTENING
      </div>
    {/if}
  </div>

  {#if !$voice.supported}
    <div class="warning">Voice not supported in this browser. Use Chrome or Edge.</div>
  {/if}
  {#if $voice.error}
    <div class="error-msg">{$voice.error}</div>
  {/if}
</div>

<style>
  .voice-controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .controls-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .interim {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    background: var(--bg-glass);
    border: 1px solid var(--border-glass);
    border-radius: 20px;
    backdrop-filter: blur(10px);
    max-width: 400px;
    text-align: center;
  }

  .interim-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--error);
    animation: blink 1s ease-in-out infinite;
    flex-shrink: 0;
  }

  .interim-text {
    font-size: 13px;
    color: var(--text-secondary);
    font-style: italic;
  }

  .mic-button {
    position: relative;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: var(--bg-glass);
    border: 2px solid var(--border-glass);
    color: var(--text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    cursor: pointer;
  }

  .mic-button:hover {
    background: var(--bg-glass-hover);
    border-color: var(--accent);
    transform: scale(1.05);
  }

  .mic-button.listening {
    background: rgba(255, 82, 82, 0.15);
    border-color: var(--error);
    color: var(--error);
    box-shadow: 0 0 30px rgba(255, 82, 82, 0.25);
  }

  .mic-button.speaking {
    background: rgba(76, 175, 80, 0.15);
    border-color: var(--success);
    color: var(--success);
    box-shadow: 0 0 20px rgba(76, 175, 80, 0.2);
  }

  .mic-button.disabled {
    opacity: 0.4;
    pointer-events: none;
  }

  .mic-inner {
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mic-ring {
    position: absolute;
    border-radius: 50%;
    border: 2px solid var(--error);
    opacity: 0;
    pointer-events: none;
  }

  .ring-1 { inset: -8px; }
  .ring-2 { inset: -18px; }
  .ring-3 { inset: -28px; }

  .ring-1.active { animation: ring-pulse 2s ease-out infinite; }
  .ring-2.active { animation: ring-pulse 2s ease-out infinite 0.5s; }
  .ring-3.active { animation: ring-pulse 2s ease-out infinite 1s; }

  .listening-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    background: rgba(255, 82, 82, 0.1);
    border: 1px solid rgba(255, 82, 82, 0.2);
    border-radius: 20px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1px;
    color: var(--error);
  }

  .pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--error);
    animation: blink 1.5s ease-in-out infinite;
  }

  .continuous-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    background: rgba(108, 99, 255, 0.15);
    border: 1px solid rgba(108, 99, 255, 0.3);
    border-radius: 20px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1px;
    color: var(--accent);
    animation: pulse-glow 2s ease-in-out infinite;
  }

  .indicator-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent);
    animation: blink 1s ease-in-out infinite;
  }

  .warning, .error-msg {
    font-size: 11px;
    padding: 4px 12px;
    border-radius: 12px;
  }

  .warning {
    color: var(--warning);
    background: rgba(255, 193, 7, 0.1);
  }

  .error-msg {
    color: var(--error);
    background: rgba(255, 82, 82, 0.1);
  }

  @keyframes ring-pulse {
    0% { opacity: 0.5; transform: scale(0.9); }
    100% { opacity: 0; transform: scale(1.4); }
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
</style>
