<script>
  import { onMount, onDestroy } from 'svelte';
  import ChatWindow from '$lib/components/ChatWindow.svelte';
  import VoiceControls from '$lib/components/VoiceControls.svelte';
  import WaveformAnimation from '$lib/components/WaveformAnimation.svelte';
  import SettingsPanel from '$lib/components/SettingsPanel.svelte';
  import StatusIndicator from '$lib/components/StatusIndicator.svelte';
  import CameraFeed from '$lib/components/CameraFeed.svelte';
  import { conversation } from '$lib/stores/conversation.js';
  import { settings } from '$lib/stores/settings.js';
  import { voice } from '$lib/stores/voice.js';
  import { camera } from '$lib/stores/camera.js';
  import * as ws from '$lib/services/websocket.js';
  import * as synthesis from '$lib/services/speech-synthesis.js';
  import { captureFrame } from '$lib/services/camera.js';
  import { sendMessage as sendRest } from '$lib/services/api.js';
  import { StreamingChatService } from '$lib/services/streaming-service.js';
  import { continuousConversation } from '$lib/services/continuous-conversation.js';
  import JarvisHUD from '$lib/components/JarvisHUD.svelte';
  import { jarvisProactiveService } from '$lib/services/jarvis-proactive.js';
  import { user } from '$lib/stores/user.js';
  import { registerUser } from '$lib/services/api.js';

  let textInput = '';
  let useStreaming = true;
  let streamBuffer = '';
  let unsubscribers = [];
  let jarvisMode = false;
  let showHUD = false;
  let videoElement;
  let showUserModal = false;
  let userName = '';
  let userEmail = '';
  let registerError = '';
  let registering = false;

  // Keep a reference to the video element inside CameraFeed
  function getVideoElement() {
    return document.querySelector('.camera-feed');
  }

  onMount(async () => {
    const savedId = localStorage.getItem('nova-conversation-id');
    if (savedId) {
      conversation.init(savedId);
    }

    // Initialize continuous conversation mode
    console.log('Starting continuous conversation...');
    await continuousConversation.start();
    console.log('Continuous conversation started, setting up callbacks');
    
    continuousConversation.onUserMessage((text) => {
      console.log('Continuous conversation received text:', text);
      handleSend(text);
    });
    
    continuousConversation.onInterruption(() => {
      // Handle interruption if needed
      console.log('Conversation interrupted');
    });

    ws.connect();
    
    const savedProfile = localStorage.getItem('nova-user-profile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      user.setProfile(profile);
    } else {
      showUserModal = true;
    }
    
    // Add keyboard shortcuts for JARVIS mode
    const handleKeyDown = (e) => {
      // Toggle JARVIS HUD with Ctrl+Shift+J
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        showHUD = !showHUD;
        jarvisMode = showHUD;
      }
      
      // Toggle JARVIS mode with Ctrl+Shift+A
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        jarvisMode = !jarvisMode;
        if (jarvisMode) {
          showHUD = true;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up event listener
    unsubscribers.push(() => {
      window.removeEventListener('keydown', handleKeyDown);
    });
    
    // Start JARVIS proactive assistance if in JARVIS mode
    if (jarvisMode) {
      jarvisProactiveService.startMonitoring();
    }

    unsubscribers.push(
      ws.on('start', ({ conversationId }) => {
        conversation.init(conversationId);
        localStorage.setItem('nova-conversation-id', conversationId);
        streamBuffer = '';
        conversation.addStreamingMessage();
        conversation.setLoading(true);
        
        // Notify continuous conversation that AI is responding
        continuousConversation.startAIResponse();
      })
    );

    unsubscribers.push(
      ws.on('chunk', ({ chunk }) => {
        streamBuffer += chunk;
        conversation.updateStreamingMessage(streamBuffer);
        
        // Use continuous conversation for speech synthesis
        if ($settings.autoSpeak && chunk.trim()) {
          continuousConversation.queueSpeech(chunk);
        }
      })
    );

    unsubscribers.push(
      ws.on('complete', ({ response, conversationId, commands }) => {
        conversation.completeStreamingMessage(response, commands);
        conversation.setLoading(false);
        streamBuffer = '';
        
        // Notify continuous conversation that AI is done responding
        continuousConversation.endAIResponse();

        // Speak the complete response if autoSpeak is enabled
        if ($settings.autoSpeak && response) {
          synthesis.speak(response, {
            rate: $settings.speechRate,
            pitch: $settings.speechPitch,
            volume: $settings.speechVolume,
            voiceName: $settings.voiceName,
            lang: $settings.language,
          });
        }
      })
    );

    unsubscribers.push(
      ws.on('error', ({ message }) => {
        conversation.setLoading(false);
        conversation.addMessage('assistant', `Error: ${message}`);
        continuousConversation.endAIResponse();
      })
    );
  });

  onDestroy(() => {
    unsubscribers.forEach((unsub) => unsub && unsub());
    ws.disconnect();
  });

  async function handleSend(text) {
    if (!text?.trim()) return;
    console.log('handleSend called with text:', text);
    const msg = text.trim();
    textInput = '';

    let currentState;
    conversation.subscribe((s) => (currentState = s))();

    conversation.addMessage('user', msg);

    // Capture camera frame if camera is active
    let image = null;
    if ($camera.enabled) {
      const vid = getVideoElement();
      if (vid) {
        image = captureFrame(vid);
      }
    }

    console.log('Sending message via WebSocket:', msg);
    // Always use streaming for continuous conversation
    let currentUser;
    user.subscribe((u) => (currentUser = u))();
    ws.sendMessage(msg, currentState.conversationId, image, currentUser.userId);
  }

  function handleVoiceResult(text) {
    handleSend(text);
  }

  function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(textInput);
    }
  }

  function handleNewChat() {
    conversation.clear();
    localStorage.removeItem('nova-conversation-id');
  }

  // Cleanup on destroy
  onDestroy(() => {
    unsubscribers.forEach((unsub) => unsub && unsub());
    ws.disconnect();
    continuousConversation.stop();
    jarvisProactiveService.stopMonitoring();
  });

  async function submitUser() {
    if (!userName.trim() || !userEmail.trim()) return;
    registerError = '';
    registering = true;
    try {
      const profile = await registerUser(userName.trim(), userEmail.trim());
      user.setProfile(profile);
      localStorage.setItem('nova-user-profile', JSON.stringify(profile));
      showUserModal = false;
    } catch (e) {
      try {
        const tempId = (crypto?.randomUUID && crypto.randomUUID()) || `local-${Date.now()}`;
        const profile = { id: tempId, name: userName.trim(), email: userEmail.trim() };
        user.setProfile(profile);
        localStorage.setItem('nova-user-profile', JSON.stringify(profile));
        showUserModal = false;
      } catch {
        registerError = 'Failed to save your details. Please try again.';
      }
    } finally {
      registering = false;
    }
  }
</script>

<div class="app">
  <!-- Header -->
  <header class="header">
    <div class="header-left">
      <div class="logo">
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 110 2h-1.17A7 7 0 0113 21.93V22h-2v-.07A7 7 0 013.17 16H2a1 1 0 110-2h1a7 7 0 017-7h1V5.73A2 2 0 0112 2z"/>
        </svg>
        <span class="logo-text">N.O.V.A.</span>
      </div>
      <StatusIndicator />
    </div>
    <div class="header-right">
      <button class="icon-btn" on:click={handleNewChat} title="New conversation">
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </button>
      <button class="icon-btn" on:click={() => settings.toggleSettings()} title="Settings">
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
        </svg>
      </button>
    </div>
  </header>

  <!-- Main Content Area -->
  <div class="main-area">
    <!-- Camera Sidebar (shows when enabled) -->
    {#if $camera.enabled}
      <div class="camera-sidebar">
        <CameraFeed compact={true} />
      </div>
    {/if}

    <!-- Chat Area -->
    <ChatWindow />
  </div>

  <!-- Bottom Controls -->
  <div class="controls-area">
    <div class="controls-top">
      {#if !$camera.enabled}
        <CameraFeed compact={true} />
      {/if}
      <WaveformAnimation />
    </div>

    <VoiceControls onResult={handleVoiceResult} disabled={$conversation.isLoading} />

    <div class="text-input-row">
      <input
        type="text"
        placeholder="Type a message or just speak..."
        bind:value={textInput}
        on:keydown={handleKeydown}
        disabled={$conversation.isLoading}
      />
      <button
        class="send-btn"
        on:click={() => handleSend(textInput)}
        disabled={!textInput.trim() || $conversation.isLoading}
        aria-label="Send message"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </div>
  </div>

  <SettingsPanel />
</div>

<!-- JARVIS HUD Overlay -->
{#if showHUD}
  <JarvisHUD />
{/if}

{#if showUserModal}
  <div class="modal-backdrop">
    <div class="modal">
      <h3>Enter your details</h3>
      <div class="field">
        <label for="user-name">Name</label>
        <input id="user-name" type="text" bind:value={userName} placeholder="Your name" />
      </div>
      <div class="field">
        <label for="user-email">Email</label>
        <input id="user-email" type="email" bind:value={userEmail} placeholder="you@example.com" />
      </div>
      {#if registerError}
        <div class="error-msg">{registerError}</div>
      {/if}
      <button class="submit-btn" on:click={submitUser} disabled={registering || !userName.trim() || !userEmail.trim()}>
        {registering ? 'Saving...' : 'Continue'}
      </button>
    </div>
  </div>
{/if}

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    max-width: 900px;
    margin: 0 auto;
    position: relative;
  }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-bottom: 1px solid var(--border-glass);
    background: var(--bg-glass);
    backdrop-filter: blur(20px);
    z-index: 10;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .header-right {
    display: flex;
    gap: 8px;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--accent-light);
  }

  .logo-text {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 3px;
  }

  .icon-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--bg-glass);
    border: 1px solid var(--border-glass);
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .icon-btn:hover {
    background: var(--bg-glass-hover);
    color: var(--text-primary);
    border-color: var(--accent);
  }

  /* Main Area */
  .main-area {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .camera-sidebar {
    padding: 12px;
    border-right: 1px solid var(--border-glass);
    display: flex;
    align-items: flex-start;
  }

  /* Bottom Controls */
  .controls-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 12px 24px 20px;
    border-top: 1px solid var(--border-glass);
    background: var(--bg-glass);
    backdrop-filter: blur(20px);
  }

  .controls-top {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .text-input-row {
    display: flex;
    gap: 8px;
    width: 100%;
    max-width: 600px;
  }

  .text-input-row input {
    flex: 1;
    padding: 12px 18px;
    background: var(--bg-glass);
    border: 1px solid var(--border-glass);
    border-radius: var(--radius);
    color: var(--text-primary);
    font-size: 14px;
    transition: border-color 0.2s;
  }

  .text-input-row input::placeholder {
    color: var(--text-muted);
  }

  .text-input-row input:focus {
    border-color: var(--accent);
  }

  .text-input-row input:disabled {
    opacity: 0.5;
  }

  .send-btn {
    width: 46px;
    height: 46px;
    border-radius: var(--radius);
    background: var(--accent);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .send-btn:hover:not(:disabled) {
    background: var(--accent-light);
    transform: scale(1.05);
  }

  .send-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }
  .modal {
    width: 320px;
    background: var(--bg-glass);
    border: 1px solid var(--border-glass);
    border-radius: var(--radius);
    padding: 16px;
  }
  .modal h3 {
    margin: 0 0 12px 0;
    font-size: 16px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
  }
  .field input {
    padding: 10px 12px;
    background: var(--bg-glass);
    border: 1px solid var(--border-glass);
    border-radius: var(--radius);
    color: var(--text-primary);
  }
  .submit-btn {
    width: 100%;
    padding: 10px 12px;
    border-radius: var(--radius);
    background: var(--accent);
    color: white;
  }
  .error-msg {
    margin: 8px 0;
    color: var(--error);
    font-size: 12px;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .header {
      padding: 12px 16px;
    }

    .controls-area {
      padding: 10px 16px 16px;
    }

    .logo-text {
      font-size: 16px;
    }

    .camera-sidebar {
      display: none;
    }

    .controls-top {
      flex-direction: column;
      gap: 8px;
    }
  }
</style>
