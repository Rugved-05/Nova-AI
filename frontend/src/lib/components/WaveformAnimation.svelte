<script>
  import { voice } from '../stores/voice.js';

  let canvas;
  let animationId;
  let bars = Array(32).fill(0);

  $: if (canvas) {
    startAnimation();
  }

  function startAnimation() {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const barCount = 32;
    const barWidth = width / barCount - 2;

    function draw() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < barCount; i++) {
        let targetHeight;

        if ($voice.isListening) {
          const vol = $voice.volume;
          const wave = Math.sin(Date.now() / 200 + i * 0.3) * 0.5 + 0.5;
          targetHeight = (vol * 0.7 + wave * 0.3) * height * 0.8 + 4;
        } else if ($voice.isSpeaking) {
          const wave = Math.sin(Date.now() / 150 + i * 0.4) * 0.5 + 0.5;
          const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
          targetHeight = wave * pulse * height * 0.5 + 4;
        } else {
          const idle = Math.sin(Date.now() / 800 + i * 0.2) * 0.1 + 0.1;
          targetHeight = idle * height + 2;
        }

        bars[i] += (targetHeight - bars[i]) * 0.15;

        const x = i * (barWidth + 2);
        const h = bars[i];
        const y = (height - h) / 2;

        const gradient = ctx.createLinearGradient(x, y, x, y + h);
        if ($voice.isListening) {
          gradient.addColorStop(0, 'rgba(255, 82, 82, 0.9)');
          gradient.addColorStop(1, 'rgba(255, 82, 82, 0.3)');
        } else if ($voice.isSpeaking) {
          gradient.addColorStop(0, 'rgba(108, 99, 255, 0.9)');
          gradient.addColorStop(1, 'rgba(168, 99, 255, 0.3)');
        } else {
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, h, 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    }

    if (animationId) cancelAnimationFrame(animationId);
    draw();
  }

  import { onDestroy } from 'svelte';
  onDestroy(() => {
    if (animationId) cancelAnimationFrame(animationId);
  });
</script>

<div class="waveform-container" class:active={$voice.isListening || $voice.isSpeaking}>
  <canvas bind:this={canvas} width="400" height="60"></canvas>
</div>

<style>
  .waveform-container {
    width: 100%;
    max-width: 400px;
    height: 60px;
    border-radius: 12px;
    overflow: hidden;
    transition: opacity 0.3s ease;
    opacity: 0.5;
  }

  .waveform-container.active {
    opacity: 1;
  }

  canvas {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
