<script>
  import { settings } from '../stores/settings.js';
  import * as synthesis from '../services/speech-synthesis.js';
  import { onMount } from 'svelte';

  let voices = [];

  onMount(() => {
    loadVoices();
    if (typeof window !== 'undefined') {
      window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    }
  });

  function loadVoices() {
    voices = synthesis.getVoices();
  }

  function handleClose() {
    settings.toggleSettings();
  }
</script>

{#if $settings.showSettings}
  <div class="overlay" on:click={handleClose} on:keydown={handleClose} role="button" tabindex="-1" aria-label="Close settings"></div>
  <div class="panel">
    <div class="panel-header">
      <h3>Settings</h3>
      <button class="close-btn" on:click={handleClose} aria-label="Close settings">
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>

    <div class="section">
      <h4>Voice Output</h4>

      <label class="toggle-row">
        <span>Auto-speak responses</span>
        <input
          type="checkbox"
          checked={$settings.autoSpeak}
          on:change={(e) => settings.update('autoSpeak', e.target.checked)}
        />
      </label>

      <label class="field">
        <span>Voice</span>
        <select
          value={$settings.voiceName}
          on:change={(e) => settings.update('voiceName', e.target.value)}
        >
          <option value="">Auto (Jarvis-like)</option>
          {#each voices as v}
            <option value={v.name}>{v.name} ({v.lang})</option>
          {/each}
        </select>
      </label>

      <label class="field">
        <span>Speed: {$settings.speechRate.toFixed(1)}x</span>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={$settings.speechRate}
          on:input={(e) => settings.update('speechRate', parseFloat(e.target.value))}
        />
      </label>

      <label class="field">
        <span>Pitch: {$settings.speechPitch.toFixed(1)}</span>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={$settings.speechPitch}
          on:input={(e) => settings.update('speechPitch', parseFloat(e.target.value))}
        />
      </label>

      <label class="field">
        <span>Volume: {Math.round($settings.speechVolume * 100)}%</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={$settings.speechVolume}
          on:input={(e) => settings.update('speechVolume', parseFloat(e.target.value))}
        />
      </label>
    </div>

    <div class="section">
      <h4>Speech Input</h4>
      <label class="field">
        <span>Language</span>
        <select
          value={$settings.language}
          on:change={(e) => settings.update('language', e.target.value)}
        >
          <option value="en-GB">English (UK) - Jarvis default</option>
          <option value="en-US">English (US)</option>
          <option value="hi-IN">Hindi</option>
          <option value="es-ES">Spanish</option>
          <option value="fr-FR">French</option>
          <option value="de-DE">German</option>
          <option value="ja-JP">Japanese</option>
        </select>
      </label>

      <div class="info-box">
        Mic runs in <strong>continuous mode</strong> - it keeps listening until you manually click the mic button to stop.
      </div>
    </div>

    <div class="section">
      <h4>Camera / Vision</h4>
      <div class="info-box">
        When camera is enabled, N.O.V.A. can see you through your webcam. It sends a snapshot with each message to an Ollama vision model (llava). Toggle the camera from the main screen.
      </div>
    </div>

    <div class="section">
      <button class="reset-btn" on:click={() => settings.reset()}>
        Reset to defaults
      </button>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 100;
  }

  .panel {
    position: fixed;
    top: 0;
    right: 0;
    width: 340px;
    height: 100%;
    background: var(--bg-secondary);
    border-left: 1px solid var(--border-glass);
    z-index: 101;
    overflow-y: auto;
    padding: 24px;
    animation: slideIn 0.25s ease;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .panel-header h3 {
    font-size: 18px;
    font-weight: 600;
  }

  .close-btn {
    background: var(--bg-glass);
    border-radius: 8px;
    padding: 6px;
    color: var(--text-secondary);
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: var(--bg-glass-hover);
    color: var(--text-primary);
  }

  .section {
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--border-glass);
  }

  .section:last-child {
    border-bottom: none;
  }

  h4 {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-muted);
    margin-bottom: 16px;
  }

  .toggle-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    cursor: pointer;
  }

  .toggle-row span {
    font-size: 14px;
    color: var(--text-secondary);
  }

  .toggle-row input[type="checkbox"] {
    width: 40px;
    height: 20px;
    accent-color: var(--accent);
    cursor: pointer;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
    cursor: pointer;
  }

  .field span {
    font-size: 13px;
    color: var(--text-secondary);
  }

  select {
    background: var(--bg-glass);
    border: 1px solid var(--border-glass);
    border-radius: var(--radius-sm);
    padding: 8px 12px;
    color: var(--text-primary);
    font-size: 13px;
    cursor: pointer;
  }

  select option {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  input[type="range"] {
    width: 100%;
    accent-color: var(--accent);
    cursor: pointer;
  }

  .reset-btn {
    width: 100%;
    padding: 10px;
    background: rgba(255, 82, 82, 0.1);
    border: 1px solid rgba(255, 82, 82, 0.2);
    border-radius: var(--radius-sm);
    color: var(--error);
    font-size: 13px;
    transition: all 0.2s;
  }

  .reset-btn:hover {
    background: rgba(255, 82, 82, 0.2);
  }

  .info-box {
    padding: 10px 14px;
    background: var(--bg-glass);
    border: 1px solid var(--border-glass);
    border-radius: var(--radius-sm);
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.5;
  }

  .info-box strong {
    color: var(--text-secondary);
  }

  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
</style>
