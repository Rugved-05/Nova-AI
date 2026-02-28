export class StreamingChatService {
  constructor() {
    this.eventSource = null;
    this.onChunk = null;
    this.onComplete = null;
    this.onError = null;
  }

  async startStreaming(message, conversationId = null, image = null) {
    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationId,
          image,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Process complete SSE messages
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); // Keep incomplete message in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              this.handleMessage(data);
            } catch (e) {
              console.warn('Failed to parse SSE message:', line);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      if (this.onError) {
        this.onError(error.message);
      }
    }
  }

  handleMessage(data) {
    switch (data.type) {
      case 'chunk':
        if (this.onChunk) {
          this.onChunk(data.content);
        }
        break;
      case 'complete':
        if (this.onComplete) {
          this.onComplete({
            response: data.content,
            conversationId: data.conversationId,
            commands: data.commands,
            timestamp: data.timestamp,
          });
        }
        break;
      case 'error':
        if (this.onError) {
          this.onError(data.message);
        }
        break;
    }
  }

  setOnChunk(callback) {
    this.onChunk = callback;
  }

  setOnComplete(callback) {
    this.onComplete = callback;
  }

  setOnError(callback) {
    this.onError = callback;
  }

  stop() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}