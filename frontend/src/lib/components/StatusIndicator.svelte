<script>
  import { onMount } from 'svelte';
  import { getHealth } from '../services/api.js';

  let status = { server: false, ollama: false, model: '' };
  let checking = true;

  onMount(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  });

  async function checkStatus() {
    checking = true;
    try {
      const data = await getHealth();
      status = {
        server: true,
        ollama: data.ollama?.running || false,
        model: data.ollama?.models?.[0] || '',
      };
    } catch {
      status = { server: false, ollama: false, model: '' };
    }
    checking = false;
  }
</script>

<div class="status-bar">
  <div class="indicator" class:ok={status.server} class:error={!status.server && !checking}>
    <span class="dot"></span>
    <span>Server</span>
  </div>
  <div class="indicator" class:ok={status.ollama} class:error={!status.ollama && !checking}>
    <span class="dot"></span>
    <span>Ollama</span>
  </div>
  {#if status.model}
    <div class="model-badge">{status.model}</div>
  {/if}
</div>

<style>
  .status-bar {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .indicator {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: var(--text-muted);
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--text-muted);
    transition: background 0.3s;
  }

  .indicator.ok .dot {
    background: var(--success);
    box-shadow: 0 0 6px rgba(76, 175, 80, 0.5);
  }

  .indicator.error .dot {
    background: var(--error);
    box-shadow: 0 0 6px rgba(255, 82, 82, 0.5);
  }

  .indicator.ok {
    color: var(--text-secondary);
  }

  .model-badge {
    padding: 2px 8px;
    background: var(--bg-glass);
    border: 1px solid var(--border-glass);
    border-radius: 10px;
    font-size: 10px;
    color: var(--text-muted);
  }
</style>
