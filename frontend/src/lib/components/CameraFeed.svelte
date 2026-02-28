<script>
  import { onMount, onDestroy } from 'svelte';
  import { camera } from '../stores/camera.js';
  import * as cameraService from '../services/camera.js';

  export let compact = false;

  let videoElement;

  $: if (videoElement && $camera.stream) {
    videoElement.srcObject = $camera.stream;
  }

  onDestroy(() => {
    cameraService.stopCamera();
  });

  async function toggleCamera() {
    if ($camera.enabled) {
      cameraService.stopCamera();
    } else {
      await cameraService.startCamera();
    }
  }
</script>

<div class="camera-wrapper" class:compact class:active={$camera.enabled}>
  {#if $camera.enabled}
    <video
      bind:this={videoElement}
      autoplay
      playsinline
      muted
      class="camera-feed"
    ></video>
    <div class="camera-overlay">
      <div class="scan-line"></div>
      <div class="corner tl"></div>
      <div class="corner tr"></div>
      <div class="corner bl"></div>
      <div class="corner br"></div>
      <span class="camera-label">LIVE</span>
    </div>
  {:else}
    <div class="camera-off">
      <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
        <path d="M18 10.48V6c0-1.1-.9-2-2-2H6.83l2 2H16v7.17l2 2v-4.69zm-1.41 9.93l1.41-1.41L3.41 4.41 2 5.82l1 1V18c0 1.1.9 2 2 2h12.17l1.42 1.41zM5 18V8.83L13.17 17H5z"/>
      </svg>
      <span>Camera Off</span>
    </div>
  {/if}

  <button
    class="camera-toggle"
    class:on={$camera.enabled}
    on:click={toggleCamera}
    title={$camera.enabled ? 'Disable camera' : 'Enable camera'}
    aria-label={$camera.enabled ? 'Disable camera' : 'Enable camera'}
  >
    {#if $camera.enabled}
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
      </svg>
    {:else}
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M18 10.48V6c0-1.1-.9-2-2-2H6.83l2 2H16v7.17l2 2v-4.69zm-1.41 9.93l1.41-1.41L3.41 4.41 2 5.82l1 1V18c0 1.1.9 2 2 2h12.17l1.42 1.41zM5 18V8.83L13.17 17H5z"/>
      </svg>
    {/if}
  </button>

  {#if $camera.error}
    <div class="camera-error">{$camera.error}</div>
  {/if}
</div>

<style>
  .camera-wrapper {
    position: relative;
    width: 200px;
    height: 150px;
    border-radius: var(--radius);
    overflow: hidden;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid var(--border-glass);
    transition: all 0.3s ease;
  }

  .camera-wrapper.compact {
    width: 140px;
    height: 105px;
  }

  .camera-wrapper.active {
    border-color: rgba(108, 99, 255, 0.3);
    box-shadow: 0 0 20px rgba(108, 99, 255, 0.1);
  }

  .camera-feed {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scaleX(-1);
  }

  .camera-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .scan-line {
    position: absolute;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(108, 99, 255, 0.5), transparent);
    animation: scan 3s ease-in-out infinite;
  }

  .corner {
    position: absolute;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(108, 99, 255, 0.5);
  }

  .tl { top: 6px; left: 6px; border-right: none; border-bottom: none; }
  .tr { top: 6px; right: 6px; border-left: none; border-bottom: none; }
  .bl { bottom: 6px; left: 6px; border-right: none; border-top: none; }
  .br { bottom: 6px; right: 6px; border-left: none; border-top: none; }

  .camera-label {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 2px 6px;
    background: rgba(255, 82, 82, 0.8);
    border-radius: 4px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1px;
    color: white;
    animation: blink 2s ease-in-out infinite;
  }

  .camera-off {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 6px;
    color: var(--text-muted);
  }

  .camera-off span {
    font-size: 11px;
  }

  .camera-toggle {
    position: absolute;
    bottom: 6px;
    right: 6px;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: var(--bg-glass);
    border: 1px solid var(--border-glass);
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    z-index: 2;
    backdrop-filter: blur(10px);
  }

  .camera-toggle:hover {
    background: var(--bg-glass-hover);
    color: var(--text-primary);
  }

  .camera-toggle.on {
    background: rgba(108, 99, 255, 0.2);
    border-color: var(--accent);
    color: var(--accent-light);
  }

  .camera-error {
    position: absolute;
    bottom: 4px;
    left: 4px;
    right: 36px;
    padding: 3px 6px;
    background: rgba(255, 82, 82, 0.15);
    border-radius: 6px;
    font-size: 9px;
    color: var(--error);
  }

  @keyframes scan {
    0% { top: 10%; opacity: 0; }
    20% { opacity: 1; }
    80% { opacity: 1; }
    100% { top: 90%; opacity: 0; }
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
</style>
