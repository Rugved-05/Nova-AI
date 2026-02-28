<script>
  import { onMount, onDestroy } from 'svelte';
  import { conversation } from '../stores/conversation.js';
  import { settings } from '../stores/settings.js';
  import { voice } from '../stores/voice.js';
  import { camera } from '../stores/camera.js';
  
  let hudElement;
  let scanLines = [];
  let dataPoints = [];
  let isScanning = false;
  let scanInterval;
  let dataInterval;
  
  // Initialize HUD elements
  onMount(() => {
    initializeScanLines();
    initializeDataPoints();
    startScanningEffect();
    startDataFlow();
  });
  
  onDestroy(() => {
    if (scanInterval) clearInterval(scanInterval);
    if (dataInterval) clearInterval(dataInterval);
  });
  
  function initializeScanLines() {
    // Create vertical scan lines for the HUD effect
    for (let i = 0; i < 20; i++) {
      scanLines.push({
        id: i,
        x: Math.random() * 100,
        opacity: Math.random() * 0.3 + 0.1,
        speed: Math.random() * 2 + 1
      });
    }
  }
  
  function initializeDataPoints() {
    // Create data points that appear randomly
    for (let i = 0; i < 15; i++) {
      dataPoints.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.7 + 0.3
      });
    }
  }
  
  function startScanningEffect() {
    scanInterval = setInterval(() => {
      scanLines = scanLines.map(line => ({
        ...line,
        x: (line.x + line.speed) % 100
      }));
    }, 50);
  }
  
  function startDataFlow() {
    dataInterval = setInterval(() => {
      dataPoints = dataPoints.map(point => ({
        ...point,
        opacity: Math.random() > 0.7 ? Math.random() * 0.7 + 0.3 : point.opacity,
        x: Math.random() * 100,
        y: Math.random() * 100
      }));
    }, 1000);
  }
  
  function formatTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  }
  
  function getSystemStatus() {
    const loading = $conversation.isLoading;
    const speaking = $voice.isSpeaking;
    const listening = $voice.isListening;
    
    if (loading) return 'PROCESSING';
    if (speaking) return 'SPEAKING';
    if (listening) return 'LISTENING';
    return 'STANDBY';
  }
  
  function getConnectionStatus() {
    return $voice.supported ? 'CONNECTED' : 'OFFLINE';
  }
  
  function getSecurityLevel() {
    // Simple security indicator based on system status
    const status = getSystemStatus();
    if (status === 'STANDBY') return 'LEVEL 5 - MAXIMUM';
    if (status === 'PROCESSING') return 'LEVEL 3 - ENHANCED';
    return 'LEVEL 4 - STANDARD';
  }
  
  $: timeDisplay = formatTime();
  $: systemStatus = getSystemStatus();
  $: connectionStatus = getConnectionStatus();
  $: securityLevel = getSecurityLevel();
</script>

<div class="jarvis-hud" bind:this={hudElement}>
  <!-- Scan Lines Effect -->
  {#each scanLines as line (line.id)}
    <div 
      class="scan-line" 
      style="left: {line.x}%; opacity: {line.opacity};"
    ></div>
  {/each}
  
  <!-- Data Points -->
  {#each dataPoints as point (point.id)}
    <div 
      class="data-point" 
      style="
        left: {point.x}%; 
        top: {point.y}%; 
        width: {point.size}px; 
        height: {point.size}px; 
        opacity: {point.opacity};
      "
    ></div>
  {/each}
  
  <!-- Status Panel -->
  <div class="status-panel">
    <div class="panel-header">
      <span class="system-name">J.A.R.V.I.S. SYSTEM</span>
      <span class="timestamp">{timeDisplay}</span>
    </div>
    
    <div class="status-grid">
      <div class="status-item">
        <span class="label">SYSTEM STATUS:</span>
        <span class="value {systemStatus === 'STANDBY' ? 'green' : systemStatus === 'PROCESSING' ? 'yellow' : 'blue'}">
          {systemStatus}
        </span>
      </div>
      
      <div class="status-item">
        <span class="label">CONNECTION:</span>
        <span class="value {connectionStatus === 'CONNECTED' ? 'green' : 'red'}">
          {connectionStatus}
        </span>
      </div>
      
      <div class="status-item">
        <span class="label">SECURITY LEVEL:</span>
        <span class="value green">{securityLevel}</span>
      </div>
      
      <div class="status-item">
        <span class="label">VOICE ENGINE:</span>
        <span class="value {$voice.isSpeaking ? 'blue' : 'green'}">
          {$voice.isSpeaking ? 'ACTIVE' : 'READY'}
        </span>
      </div>
    </div>
  </div>
  
  <!-- Conversation Panel -->
  {#if $conversation.messages.length > 0}
    <div class="conversation-panel">
      <div class="panel-header">
        <span>RECENT INTERACTIONS</span>
      </div>
      <div class="conversation-list">
        {#each $conversation.messages.slice(-3) as msg, i (i)}
          <div class="conversation-item {msg.role}">
            <span class="role">{msg.role === 'user' ? 'USER' : 'JARVIS'}:</span>
            <span class="content">{msg.content.substring(0, 60)}{msg.content.length > 60 ? '...' : ''}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
  
  <!-- Data Visualization -->
  <div class="data-panel">
    <div class="panel-header">
      <span>SYSTEM MONITORING</span>
    </div>
    <div class="graphs">
      <div class="graph-container">
        <div class="graph-label">CPU USAGE</div>
        <div class="graph-bar" style="width: {Math.random() * 60 + 20}%"></div>
      </div>
      <div class="graph-container">
        <div class="graph-label">MEMORY</div>
        <div class="graph-bar" style="width: {Math.random() * 70 + 10}%"></div>
      </div>
      <div class="graph-container">
        <div class="graph-label">NETWORK</div>
        <div class="graph-bar" style="width: {Math.random() * 50 + 30}%"></div>
      </div>
    </div>
  </div>
  
  <!-- Command Suggestions -->
  <div class="commands-panel">
    <div class="panel-header">
      <span>QUICK COMMANDS</span>
    </div>
    <div class="commands-list">
      <button class="command-btn">SYSTEM STATUS</button>
      <button class="command-btn">OPEN APPLICATION</button>
      <button class="command-btn">NETWORK INFO</button>
      <button class="command-btn">SECURITY SCAN</button>
    </div>
  </div>
</div>

<style>
  .jarvis-hud {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.85);
    color: #00ff41;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    z-index: 1000;
    pointer-events: none;
    overflow: hidden;
  }
  
  .scan-line {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background: linear-gradient(to bottom, transparent, #00ff41, transparent);
    pointer-events: none;
  }
  
  .data-point {
    position: absolute;
    background: #00ff41;
    border-radius: 50%;
    pointer-events: none;
    box-shadow: 0 0 5px #00ff41;
  }
  
  .status-panel {
    position: absolute;
    top: 20px;
    left: 20px;
    width: 300px;
    background: rgba(0, 255, 65, 0.1);
    border: 1px solid #00ff41;
    padding: 15px;
    pointer-events: auto;
  }
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
    padding-bottom: 8px;
    border-bottom: 1px solid #00ff41;
    font-weight: bold;
    font-size: 14px;
  }
  
  .system-name {
    color: #00ff41;
  }
  
  .timestamp {
    color: #00aaff;
  }
  
  .status-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  
  .status-item {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  
  .label {
    color: #00aaff;
    font-size: 10px;
  }
  
  .value {
    font-weight: bold;
    font-size: 11px;
  }
  
  .value.green { color: #00ff41; }
  .value.yellow { color: #ffff00; }
  .value.blue { color: #00aaff; }
  .value.red { color: #ff0000; }
  
  .conversation-panel {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 300px;
    background: rgba(0, 255, 65, 0.1);
    border: 1px solid #00ff41;
    padding: 15px;
    pointer-events: auto;
  }
  
  .conversation-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .conversation-item {
    padding: 5px;
    border-left: 2px solid #00ff41;
    font-size: 11px;
  }
  
  .conversation-item.user {
    border-left-color: #00aaff;
  }
  
  .role {
    font-weight: bold;
    margin-right: 5px;
  }
  
  .data-panel {
    position: absolute;
    bottom: 150px;
    left: 20px;
    width: 400px;
    background: rgba(0, 255, 65, 0.1);
    border: 1px solid #00ff41;
    padding: 15px;
    pointer-events: auto;
  }
  
  .graphs {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .graph-container {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .graph-label {
    width: 80px;
    color: #00aaff;
    font-size: 10px;
  }
  
  .graph-bar {
    height: 8px;
    background: linear-gradient(to right, #00ff41, #00aaff);
    border-radius: 4px;
    transition: width 0.5s ease;
  }
  
  .commands-panel {
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 250px;
    background: rgba(0, 255, 65, 0.1);
    border: 1px solid #00ff41;
    padding: 15px;
    pointer-events: auto;
  }
  
  .commands-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  
  .command-btn {
    background: rgba(0, 255, 65, 0.2);
    border: 1px solid #00ff41;
    color: #00ff41;
    padding: 8px;
    font-family: 'Courier New', monospace;
    font-size: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .command-btn:hover {
    background: rgba(0, 255, 65, 0.4);
    box-shadow: 0 0 10px #00ff41;
  }
  
  /* Matrix-style background effect */
  .jarvis-hud::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 30%, rgba(0, 255, 65, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(0, 170, 255, 0.1) 0%, transparent 50%);
    pointer-events: none;
  }
</style>