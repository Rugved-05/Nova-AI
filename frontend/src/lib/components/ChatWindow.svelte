<script>
  import { conversation } from '../stores/conversation.js';
  import MessageBubble from './MessageBubble.svelte';
  import { onMount, afterUpdate } from 'svelte';

  let chatContainer;
  let shouldAutoScroll = true;

  afterUpdate(() => {
    if (shouldAutoScroll && chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  });

  function handleScroll() {
    if (!chatContainer) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainer;
    shouldAutoScroll = scrollHeight - scrollTop - clientHeight < 100;
  }
</script>

<div class="chat-window" bind:this={chatContainer} on:scroll={handleScroll}>
  {#if $conversation.messages.length === 0}
    <div class="empty-state">
      <div class="logo-ring">
        <div class="inner-ring"></div>
        <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40">
          <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 110 2h-1.17A7 7 0 0113 21.93V22h-2v-.07A7 7 0 013.17 16H2a1 1 0 110-2h1a7 7 0 017-7h1V5.73A2 2 0 0112 2zm0 7a5 5 0 00-5 5 5 5 0 005 5 5 5 0 005-5 5 5 0 00-5-5z"/>
        </svg>
      </div>
      <h2>NOVA</h2>
      <p>Your AI Voice Assistant</p>
      <div class="suggestions">
        <span>"What's the weather today?"</span>
        <span>"Search for latest tech news"</span>
        <span>"Open YouTube"</span>
        <span>"Tell me a fun fact"</span>
      </div>
    </div>
  {:else}
    {#each $conversation.messages as msg, i (i)}
      <MessageBubble
        role={msg.role}
        content={msg.content}
        timestamp={msg.timestamp}
        commands={msg.commands}
      />
    {/each}
    {#if $conversation.isLoading}
      <div class="typing-indicator">
        <div class="avatar-small">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 110 2h-1.17A7 7 0 0113 21.93V22h-2v-.07A7 7 0 013.17 16H2a1 1 0 110-2h1a7 7 0 017-7h1V5.73A2 2 0 0112 2z"/>
          </svg>
        </div>
        <div class="dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .chat-window {
    flex: 1;
    overflow-y: auto;
    padding: 20px 0;
    scroll-behavior: smooth;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 12px;
    color: var(--text-secondary);
    text-align: center;
    padding: 40px;
  }

  .logo-ring {
    position: relative;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), #a855f7);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    margin-bottom: 8px;
    animation: pulse-glow 3s ease-in-out infinite;
  }

  .inner-ring {
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 2px solid var(--accent);
    opacity: 0.3;
    animation: spin-slow 8s linear infinite;
  }

  .empty-state h2 {
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: 4px;
  }

  .empty-state p {
    font-size: 14px;
    color: var(--text-muted);
  }

  .suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    margin-top: 24px;
    max-width: 500px;
  }

  .suggestions span {
    padding: 8px 16px;
    background: var(--bg-glass);
    border: 1px solid var(--border-glass);
    border-radius: 20px;
    font-size: 13px;
    color: var(--text-secondary);
    cursor: default;
    transition: all 0.2s;
  }

  .suggestions span:hover {
    background: var(--bg-glass-hover);
    color: var(--text-primary);
  }

  .typing-indicator {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 20px;
    animation: fadeIn 0.3s ease;
  }

  .avatar-small {
    width: 28px;
    height: 28px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--accent), #a855f7);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .dots {
    display: flex;
    gap: 4px;
    padding: 10px 14px;
    background: var(--assistant-bubble);
    border: 1px solid var(--border-glass);
    border-radius: var(--radius);
    backdrop-filter: blur(10px);
  }

  .dots span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--text-secondary);
    animation: bounce 1.4s ease-in-out infinite;
  }

  .dots span:nth-child(2) { animation-delay: 0.2s; }
  .dots span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-6px); }
  }

  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px var(--accent-glow); }
    50% { box-shadow: 0 0 40px var(--accent-glow), 0 0 60px rgba(108, 99, 255, 0.1); }
  }

  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
