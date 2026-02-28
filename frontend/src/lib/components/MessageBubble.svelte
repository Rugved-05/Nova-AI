<script>
  export let role = 'user';
  export let content = '';
  export let timestamp = '';
  export let commands = [];

  function formatTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="bubble {role}">
  <div class="avatar">
    {#if role === 'user'}
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
    {:else}
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 110 2h-1.17A7 7 0 0113 21.93V22h-2v-.07A7 7 0 013.17 16H2a1 1 0 110-2h1a7 7 0 017-7h1V5.73A2 2 0 0112 2zm0 7a5 5 0 00-5 5 5 5 0 005 5 5 5 0 005-5 5 5 0 00-5-5zm0 2a3 3 0 013 3 3 3 0 01-3 3 3 3 0 01-3-3 3 3 0 013-3z"/>
      </svg>
    {/if}
  </div>
  <div class="content-wrapper">
    <div class="meta">
      <span class="role-label">{role === 'user' ? 'You' : 'NOVA'}</span>
      {#if timestamp}
        <span class="time">{formatTime(timestamp)}</span>
      {/if}
    </div>
    <div class="text">{content}</div>
    {#if commands && commands.length > 0}
      <div class="commands">
        {#each commands as cmd}
          <div class="command-badge">
            {#if cmd.type === 'weather'}
              <span class="cmd-icon">&#9748;</span>
            {:else if cmd.type === 'news'}
              <span class="cmd-icon">&#128240;</span>
            {:else if cmd.type === 'open_url' || cmd.type === 'search'}
              <span class="cmd-icon">&#128279;</span>
            {:else}
              <span class="cmd-icon">&#9881;</span>
            {/if}
            <span>{cmd.message || cmd.type}</span>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .bubble {
    display: flex;
    gap: 12px;
    padding: 16px 20px;
    animation: fadeIn 0.3s ease;
    max-width: 100%;
  }

  .bubble.user {
    flex-direction: row-reverse;
  }

  .avatar {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .user .avatar {
    background: var(--user-bubble);
    color: var(--accent-light);
  }

  .assistant .avatar {
    background: linear-gradient(135deg, var(--accent), #a855f7);
    color: white;
  }

  .content-wrapper {
    max-width: 75%;
    min-width: 0;
  }

  .user .content-wrapper {
    align-items: flex-end;
    text-align: right;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .user .meta {
    flex-direction: row-reverse;
  }

  .role-label {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-secondary);
  }

  .time {
    font-size: 11px;
    color: var(--text-muted);
  }

  .text {
    padding: 12px 16px;
    border-radius: var(--radius);
    line-height: 1.6;
    font-size: 14px;
    word-wrap: break-word;
    white-space: pre-wrap;
  }

  .user .text {
    background: var(--user-bubble);
    border: 1px solid rgba(108, 99, 255, 0.15);
    border-top-right-radius: 4px;
  }

  .assistant .text {
    background: var(--assistant-bubble);
    border: 1px solid var(--border-glass);
    border-top-left-radius: 4px;
    backdrop-filter: blur(10px);
  }

  .commands {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }

  .user .commands {
    justify-content: flex-end;
  }

  .command-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: rgba(76, 175, 80, 0.1);
    border: 1px solid rgba(76, 175, 80, 0.2);
    border-radius: 20px;
    font-size: 11px;
    color: var(--success);
  }

  .cmd-icon {
    font-size: 12px;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
