import { a6 as ssr_context, a7 as fallback, a8 as attr_class, e as escape_html, a9 as ensure_array_like, aa as bind_props, ab as stringify, ac as store_get, ad as unsubscribe_stores, ae as attr } from "../../chunks/index2.js";
import "clsx";
import { w as writable } from "../../chunks/index.js";
import { io } from "socket.io-client";
function onDestroy(fn) {
  /** @type {SSRContext} */
  ssr_context.r.on_destroy(fn);
}
function createConversationStore() {
  const { subscribe, set, update } = writable({
    conversationId: null,
    messages: [],
    isLoading: false
  });
  return {
    subscribe,
    init(id) {
      update((s) => ({ ...s, conversationId: id }));
    },
    addMessage(role, content, commands = []) {
      update((s) => ({
        ...s,
        messages: [
          ...s.messages,
          { role, content, commands, timestamp: (/* @__PURE__ */ new Date()).toISOString() }
        ]
      }));
    },
    // Add streaming message (initially empty)
    addStreamingMessage() {
      update((s) => ({
        ...s,
        messages: [
          ...s.messages,
          { role: "assistant", content: "", commands: [], timestamp: (/* @__PURE__ */ new Date()).toISOString(), streaming: true }
        ]
      }));
    },
    // Update streaming message content
    updateStreamingMessage(content) {
      update((s) => {
        const msgs = [...s.messages];
        const lastIndex = msgs.length - 1;
        if (lastIndex >= 0 && msgs[lastIndex].streaming) {
          msgs[lastIndex] = { ...msgs[lastIndex], content };
        }
        return { ...s, messages: msgs };
      });
    },
    // Complete streaming message
    completeStreamingMessage(content, commands = []) {
      update((s) => {
        const msgs = [...s.messages];
        const lastIndex = msgs.length - 1;
        if (lastIndex >= 0 && msgs[lastIndex].streaming) {
          msgs[lastIndex] = {
            ...msgs[lastIndex],
            content,
            commands,
            streaming: false
          };
        }
        return { ...s, messages: msgs };
      });
    },
    updateLastAssistant(content) {
      update((s) => {
        const msgs = [...s.messages];
        for (let i = msgs.length - 1; i >= 0; i--) {
          if (msgs[i].role === "assistant") {
            msgs[i] = { ...msgs[i], content };
            break;
          }
        }
        return { ...s, messages: msgs };
      });
    },
    setLoading(loading) {
      update((s) => ({ ...s, isLoading: loading }));
    },
    clear() {
      set({ conversationId: null, messages: [], isLoading: false });
    },
    loadMessages(conversationId, messages) {
      set({ conversationId, messages, isLoading: false });
    }
  };
}
const conversation = createConversationStore();
function MessageBubble($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let role = fallback($$props["role"], "user");
    let content = fallback($$props["content"], "");
    let timestamp = fallback($$props["timestamp"], "");
    let commands = fallback($$props["commands"], () => [], true);
    function formatTime(ts) {
      if (!ts) return "";
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    $$renderer2.push(`<div${attr_class(`bubble ${stringify(role)}`, "svelte-1e5n1dp")}><div class="avatar svelte-1e5n1dp">`);
    if (role === "user") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 110 2h-1.17A7 7 0 0113 21.93V22h-2v-.07A7 7 0 013.17 16H2a1 1 0 110-2h1a7 7 0 017-7h1V5.73A2 2 0 0112 2zm0 7a5 5 0 00-5 5 5 5 0 005 5 5 5 0 005-5 5 5 0 00-5-5zm0 2a3 3 0 013 3 3 3 0 01-3 3 3 3 0 01-3-3 3 3 0 013-3z"></path></svg>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="content-wrapper svelte-1e5n1dp"><div class="meta svelte-1e5n1dp"><span class="role-label svelte-1e5n1dp">${escape_html(role === "user" ? "You" : "NOVA")}</span> `);
    if (timestamp) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span class="time svelte-1e5n1dp">${escape_html(formatTime(timestamp))}</span>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> <div class="text svelte-1e5n1dp">${escape_html(content)}</div> `);
    if (commands && commands.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="commands svelte-1e5n1dp"><!--[-->`);
      const each_array = ensure_array_like(commands);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let cmd = each_array[$$index];
        $$renderer2.push(`<div class="command-badge svelte-1e5n1dp">`);
        if (cmd.type === "weather") {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<span class="cmd-icon svelte-1e5n1dp">☔</span>`);
        } else if (cmd.type === "news") {
          $$renderer2.push("<!--[1-->");
          $$renderer2.push(`<span class="cmd-icon svelte-1e5n1dp">📰</span>`);
        } else if (cmd.type === "open_url" || cmd.type === "search") {
          $$renderer2.push("<!--[2-->");
          $$renderer2.push(`<span class="cmd-icon svelte-1e5n1dp">🔗</span>`);
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<span class="cmd-icon svelte-1e5n1dp">⚙</span>`);
        }
        $$renderer2.push(`<!--]--> <span>${escape_html(cmd.message || cmd.type)}</span></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div></div>`);
    bind_props($$props, { role, content, timestamp, commands });
  });
}
function ChatWindow($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    $$renderer2.push(`<div class="chat-window svelte-1jlre7m">`);
    if (store_get($$store_subs ??= {}, "$conversation", conversation).messages.length === 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="empty-state svelte-1jlre7m"><div class="logo-ring svelte-1jlre7m"><div class="inner-ring svelte-1jlre7m"></div> <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40" class="svelte-1jlre7m"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 110 2h-1.17A7 7 0 0113 21.93V22h-2v-.07A7 7 0 013.17 16H2a1 1 0 110-2h1a7 7 0 017-7h1V5.73A2 2 0 0112 2zm0 7a5 5 0 00-5 5 5 5 0 005 5 5 5 0 005-5 5 5 0 00-5-5z" class="svelte-1jlre7m"></path></svg></div> <h2 class="svelte-1jlre7m">NOVA</h2> <p class="svelte-1jlre7m">Your AI Voice Assistant</p> <div class="suggestions svelte-1jlre7m"><span class="svelte-1jlre7m">"What's the weather today?"</span> <span class="svelte-1jlre7m">"Search for latest tech news"</span> <span class="svelte-1jlre7m">"Open YouTube"</span> <span class="svelte-1jlre7m">"Tell me a fun fact"</span></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(store_get($$store_subs ??= {}, "$conversation", conversation).messages);
      for (let i = 0, $$length = each_array.length; i < $$length; i++) {
        let msg = each_array[i];
        MessageBubble($$renderer2, {
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          commands: msg.commands
        });
      }
      $$renderer2.push(`<!--]--> `);
      if (store_get($$store_subs ??= {}, "$conversation", conversation).isLoading) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="typing-indicator svelte-1jlre7m"><div class="avatar-small svelte-1jlre7m"><svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" class="svelte-1jlre7m"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 110 2h-1.17A7 7 0 0113 21.93V22h-2v-.07A7 7 0 013.17 16H2a1 1 0 110-2h1a7 7 0 017-7h1V5.73A2 2 0 0112 2z" class="svelte-1jlre7m"></path></svg></div> <div class="dots svelte-1jlre7m"><span class="svelte-1jlre7m"></span><span class="svelte-1jlre7m"></span><span class="svelte-1jlre7m"></span></div></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function createVoiceStore() {
  const { subscribe, update } = writable({
    isListening: false,
    isSpeaking: false,
    interimTranscript: "",
    volume: 0,
    error: null,
    supported: true
  });
  return {
    subscribe,
    setListening(val) {
      update((s) => ({ ...s, isListening: val, error: null }));
    },
    setSpeaking(val) {
      update((s) => ({ ...s, isSpeaking: val }));
    },
    setInterim(text) {
      update((s) => ({ ...s, interimTranscript: text }));
    },
    setVolume(vol) {
      update((s) => ({ ...s, volume: vol }));
    },
    setError(err) {
      update((s) => ({ ...s, error: err, isListening: false }));
    },
    setSupported(val) {
      update((s) => ({ ...s, supported: val }));
    }
  };
}
const voice = createVoiceStore();
const STORAGE_KEY = "nova-settings";
function loadSettings() {
  if (typeof localStorage === "undefined") return {};
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}
const defaults = {
  autoSpeak: true,
  voiceName: "",
  speechRate: 0.95,
  speechPitch: 0.85,
  speechVolume: 1,
  language: "en-GB",
  continuousListening: true,
  cameraEnabled: false,
  showSettings: false
};
function createSettingsStore() {
  const initial = { ...defaults, ...loadSettings() };
  const { subscribe, update, set } = writable(initial);
  function save(state) {
    if (typeof localStorage !== "undefined") {
      const { showSettings, ...toSave } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }
  }
  return {
    subscribe,
    update(key, value) {
      update((s) => {
        const next = { ...s, [key]: value };
        save(next);
        return next;
      });
    },
    toggleSettings() {
      update((s) => ({ ...s, showSettings: !s.showSettings }));
    },
    reset() {
      set({ ...defaults });
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  };
}
const settings = createSettingsStore();
let recognition = null;
let audioContext = null;
let analyser = null;
let micStream = null;
let volumeInterval = null;
let continuousMode = false;
let onResultCb = null;
let onErrorCb = null;
let shouldRestart = false;
function isSupported$1() {
  return !!(typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition));
}
function create(options = {}) {
  if (!isSupported$1()) {
    voice.setSupported(false);
    return null;
  }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = options.lang || "en-US";
  recognition.maxAlternatives = 1;
  return recognition;
}
async function start(onResult, onError, lang = "en-US") {
  if (!recognition) create({ lang });
  if (!recognition) return;
  onResultCb = onResult;
  onErrorCb = onError;
  shouldRestart = true;
  continuousMode = true;
  recognition.lang = lang;
  recognition.onresult = (event) => {
    let interim = "";
    let final = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final += transcript;
      } else {
        interim += transcript;
      }
    }
    voice.setInterim(interim || final);
    if (final && onResultCb) {
      onResultCb(final.trim());
    }
  };
  recognition.onerror = (event) => {
    if (event.error === "no-speech" || event.error === "aborted") {
      return;
    }
    voice.setError(event.error);
    if (onErrorCb) onErrorCb(event.error);
  };
  recognition.onend = () => {
    voice.setInterim("");
    if (shouldRestart && continuousMode) {
      try {
        setTimeout(() => {
          if (shouldRestart && recognition) {
            recognition.start();
          }
        }, 100);
      } catch {
      }
    } else {
      voice.setListening(false);
      stopVolumeMonitor();
    }
  };
  try {
    recognition.start();
    voice.setListening(true);
    await startVolumeMonitor();
  } catch (err) {
    voice.setError(err.message);
  }
}
function stop$1() {
  shouldRestart = false;
  continuousMode = false;
  if (recognition) {
    try {
      recognition.stop();
    } catch {
    }
  }
  voice.setListening(false);
  voice.setInterim("");
  stopVolumeMonitor();
}
async function startVolumeMonitor() {
  if (audioContext && micStream) return;
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContext.createMediaStreamSource(micStream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    volumeInterval = setInterval(() => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const avg = sum / dataArray.length / 255;
      voice.setVolume(avg);
    }, 50);
  } catch {
  }
}
function stopVolumeMonitor() {
  if (volumeInterval) {
    clearInterval(volumeInterval);
    volumeInterval = null;
  }
  if (micStream) {
    micStream.getTracks().forEach((t) => t.stop());
    micStream = null;
  }
  if (audioContext) {
    audioContext.close().catch(() => {
    });
    audioContext = null;
  }
  voice.setVolume(0);
}
const PREFERRED_VOICE_KEYWORDS = [
  "Google UK English Male",
  "Microsoft Ryan",
  "Microsoft George",
  "Daniel",
  "James",
  "Google UK English",
  "English United Kingdom",
  "en-GB",
  "Male"
];
function isSupported() {
  return !!(typeof window !== "undefined" && window.speechSynthesis);
}
function getVoices() {
  if (!isSupported()) return [];
  return window.speechSynthesis.getVoices();
}
function findBestVoice() {
  const voices = getVoices();
  if (!voices.length) return null;
  for (const keyword of PREFERRED_VOICE_KEYWORDS) {
    const match = voices.find(
      (v) => v.name.includes(keyword) || v.lang.includes(keyword)
    );
    if (match) return match;
  }
  return voices.find((v) => v.lang.startsWith("en")) || voices[0];
}
function speak(text, options = {}) {
  if (!isSupported() || !text) return;
  stop();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.rate ?? 0.95;
  utterance.pitch = options.pitch ?? 0.85;
  utterance.volume = options.volume ?? 1;
  utterance.lang = options.lang || "en-GB";
  if (options.voiceName) {
    const voices = getVoices();
    const match = voices.find((v) => v.name === options.voiceName);
    if (match) utterance.voice = match;
  } else {
    const best = findBestVoice();
    if (best) utterance.voice = best;
  }
  utterance.onstart = () => voice.setSpeaking(true);
  utterance.onend = () => voice.setSpeaking(false);
  utterance.onerror = () => voice.setSpeaking(false);
  window.speechSynthesis.speak(utterance);
}
function stop() {
  if (isSupported()) {
    window.speechSynthesis.cancel();
  }
  voice.setSpeaking(false);
}
class ContinuousConversation {
  constructor() {
    this.isSpacePressed = false;
    this.isAIResponding = false;
    this.isContinuousMode = false;
    this.speechQueue = [];
    this.isSpeaking = false;
    this.interruptThreshold = 0.3;
    this.interruptionTimeout = null;
    this.pushToTalkKey = " ";
  }
  // Initialize continuous conversation mode
  async start() {
    if (this.isContinuousMode) return;
    this.isContinuousMode = true;
    try {
      await start(
        (text) => this.handleVoiceInput(text),
        (error) => this.handleVoiceError(error),
        settings.get()?.language || "en-US"
      );
    } catch (error) {
      console.error("Failed to start voice recognition:", error);
      this.isContinuousMode = false;
      return;
    }
    this.addKeyboardListeners();
    this.addInterruptionDetection();
  }
  // Stop continuous conversation mode
  stop() {
    this.isContinuousMode = false;
    this.isSpacePressed = false;
    this.isAIResponding = false;
    stop$1();
    this.removeKeyboardListeners();
    this.removeInterruptionDetection();
    this.clearInterruptionTimeout();
  }
  // Handle voice input from recognition
  handleVoiceInput(text) {
    if (!text.trim() || !this.isContinuousMode) return;
    console.log("Voice input detected:", text);
    if (this.isAIResponding) {
      console.log("Interrupting AI response");
      this.interruptAIResponse();
    }
    this.onUserMessage?.(text.trim());
  }
  // Handle voice recognition errors
  handleVoiceError(error) {
    console.warn("Voice recognition error:", error);
    if (this.isContinuousMode) {
      setTimeout(() => {
        if (this.isContinuousMode) {
          this.start();
        }
      }, 1e3);
    }
  }
  // Add keyboard listeners for push-to-talk
  addKeyboardListeners() {
    this.keyDownHandler = (e) => {
      if (e.key === this.pushToTalkKey && !e.repeat) {
        this.isSpacePressed = true;
        voice.setListening(true);
        e.preventDefault();
      }
    };
    this.keyUpHandler = (e) => {
      if (e.key === this.pushToTalkKey) {
        this.isSpacePressed = false;
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", this.keyDownHandler);
    window.addEventListener("keyup", this.keyUpHandler);
  }
  // Remove keyboard listeners
  removeKeyboardListeners() {
    if (this.keyDownHandler) {
      window.removeEventListener("keydown", this.keyDownHandler);
      this.keyDownHandler = null;
    }
    if (this.keyUpHandler) {
      window.removeEventListener("keyup", this.keyUpHandler);
      this.keyUpHandler = null;
    }
  }
  // Add interruption detection based on audio volume
  addInterruptionDetection() {
    this.unsubscribe = voice.subscribe((state) => {
      if (this.isAIResponding && state.volume > this.interruptThreshold) {
        this.handleInterruption();
      }
    });
  }
  // Remove interruption detection
  removeInterruptionDetection() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
  // Handle interruption detection
  handleInterruption() {
    if (this.interruptionTimeout) {
      clearTimeout(this.interruptionTimeout);
    }
    this.interruptionTimeout = setTimeout(() => {
      if (this.isAIResponding) {
        this.interruptAIResponse();
      }
    }, 300);
  }
  // Clear interruption timeout
  clearInterruptionTimeout() {
    if (this.interruptionTimeout) {
      clearTimeout(this.interruptionTimeout);
      this.interruptionTimeout = null;
    }
  }
  // Interrupt AI response
  interruptAIResponse() {
    console.log("Interrupting AI response...");
    this.clearInterruptionTimeout();
    stop();
    this.isAIResponding = false;
    this.speechQueue = [];
    this.isSpeaking = false;
    this.onInterruption?.();
  }
  // AI starts responding
  startAIResponse() {
    this.isAIResponding = true;
    this.clearInterruptionTimeout();
  }
  // AI finishes responding
  endAIResponse() {
    this.isAIResponding = false;
    this.clearInterruptionTimeout();
  }
  // Queue speech for natural conversation flow
  queueSpeech(text) {
    if (!text.trim()) return;
    this.speechQueue.push(text);
    if (!this.isSpeaking) {
      this.processSpeechQueue();
    }
  }
  // Process speech queue
  processSpeechQueue() {
    if (this.speechQueue.length === 0) {
      this.isSpeaking = false;
      return;
    }
    if (this.isAIResponding === false) {
      this.speechQueue = [];
      this.isSpeaking = false;
      return;
    }
    this.isSpeaking = true;
    const text = this.speechQueue.shift();
    const currentSettings = settings.get();
    speak(text, {
      rate: currentSettings?.speechRate ?? 0.95,
      pitch: currentSettings?.speechPitch ?? 0.85,
      volume: currentSettings?.speechVolume ?? 1,
      voiceName: currentSettings?.voiceName ?? "",
      lang: currentSettings?.language ?? "en-US"
    });
    setTimeout(() => {
      const checkSpeech = () => {
        if (!window.speechSynthesis.speaking) {
          this.isSpeaking = false;
          this.processSpeechQueue();
        } else {
          setTimeout(checkSpeech, 100);
        }
      };
      setTimeout(checkSpeech, 300);
    }, 100);
  }
  // Set callback for user messages
  onUserMessage(callback) {
    this.onUserMessage = callback;
  }
  // Set callback for interruption events
  onInterruption(callback) {
    this.onInterruption = callback;
  }
  // Check if currently in continuous mode
  isActive() {
    return this.isContinuousMode;
  }
  // Check if push-to-talk is active
  isPushToTalkActive() {
    return this.isSpacePressed;
  }
}
const continuousConversation = new ContinuousConversation();
function VoiceControls($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let onResult = fallback($$props["onResult"], () => {
    });
    let disabled = fallback($$props["disabled"], false);
    $$renderer2.push(`<div class="voice-controls svelte-mqozx4">`);
    if (continuousConversation.isActive()) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="continuous-indicator svelte-mqozx4"><span class="indicator-dot svelte-mqozx4"></span> <span class="indicator-text svelte-mqozx4">`);
      if (continuousConversation.isPushToTalkActive()) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`PUSH-TO-TALK ACTIVE (HOLD SPACE)`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`CONTINUOUS LISTENING`);
      }
      $$renderer2.push(`<!--]--></span></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (store_get($$store_subs ??= {}, "$voice", voice).interimTranscript) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="interim svelte-mqozx4"><span class="interim-dot svelte-mqozx4"></span> <span class="interim-text svelte-mqozx4">${escape_html(store_get($$store_subs ??= {}, "$voice", voice).interimTranscript)}</span></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="controls-row svelte-mqozx4"><button${attr_class("mic-button svelte-mqozx4", void 0, {
      "listening": store_get($$store_subs ??= {}, "$voice", voice).isListening,
      "speaking": store_get($$store_subs ??= {}, "$voice", voice).isSpeaking,
      "disabled": disabled || continuousConversation.isActive()
    })}${attr("title", continuousConversation.isActive() ? "Continuous mode active - use spacebar" : store_get($$store_subs ??= {}, "$voice", voice).isListening ? "Stop listening" : "Start listening")}><div${attr_class("mic-ring ring-1 svelte-mqozx4", void 0, {
      "active": store_get($$store_subs ??= {}, "$voice", voice).isListening
    })}></div> <div${attr_class("mic-ring ring-2 svelte-mqozx4", void 0, {
      "active": store_get($$store_subs ??= {}, "$voice", voice).isListening
    })}></div> <div${attr_class("mic-ring ring-3 svelte-mqozx4", void 0, {
      "active": store_get($$store_subs ??= {}, "$voice", voice).isListening
    })}></div> <div class="mic-inner svelte-mqozx4">`);
    if (store_get($$store_subs ??= {}, "$voice", voice).isListening) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" class="svelte-mqozx4"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" class="svelte-mqozx4"></path><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" class="svelte-mqozx4"></path></svg>`);
    } else if (store_get($$store_subs ??= {}, "$voice", voice).isSpeaking) {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" class="svelte-mqozx4"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" class="svelte-mqozx4"></path></svg>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" class="svelte-mqozx4"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" class="svelte-mqozx4"></path><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" class="svelte-mqozx4"></path></svg>`);
    }
    $$renderer2.push(`<!--]--></div></button> `);
    if (store_get($$store_subs ??= {}, "$voice", voice).isListening) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="listening-badge svelte-mqozx4"><span class="pulse-dot svelte-mqozx4"></span> ALWAYS LISTENING</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    if (!store_get($$store_subs ??= {}, "$voice", voice).supported) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="warning svelte-mqozx4">Voice not supported in this browser. Use Chrome or Edge.</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (store_get($$store_subs ??= {}, "$voice", voice).error) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="error-msg svelte-mqozx4">${escape_html(store_get($$store_subs ??= {}, "$voice", voice).error)}</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
    bind_props($$props, { onResult, disabled });
  });
}
function WaveformAnimation($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    Array(32).fill(0);
    onDestroy(() => {
    });
    $$renderer2.push(`<div${attr_class("waveform-container svelte-lmximv", void 0, {
      "active": store_get($$store_subs ??= {}, "$voice", voice).isListening || store_get($$store_subs ??= {}, "$voice", voice).isSpeaking
    })}><canvas width="400" height="60" class="svelte-lmximv"></canvas></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function SettingsPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let voices = [];
    if (store_get($$store_subs ??= {}, "$settings", settings).showSettings) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="overlay svelte-d580bl" role="button" tabindex="-1" aria-label="Close settings"></div> <div class="panel svelte-d580bl"><div class="panel-header svelte-d580bl"><h3 class="svelte-d580bl">Settings</h3> <button class="close-btn svelte-d580bl" aria-label="Close settings"><svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg></button></div> <div class="section svelte-d580bl"><h4 class="svelte-d580bl">Voice Output</h4> <label class="toggle-row svelte-d580bl"><span class="svelte-d580bl">Auto-speak responses</span> <input type="checkbox"${attr("checked", store_get($$store_subs ??= {}, "$settings", settings).autoSpeak, true)} class="svelte-d580bl"/></label> <label class="field svelte-d580bl"><span class="svelte-d580bl">Voice</span> `);
      $$renderer2.select(
        {
          value: store_get($$store_subs ??= {}, "$settings", settings).voiceName,
          class: ""
        },
        ($$renderer3) => {
          $$renderer3.option(
            { value: "", class: "" },
            ($$renderer4) => {
              $$renderer4.push(`Auto (Jarvis-like)`);
            },
            "svelte-d580bl"
          );
          $$renderer3.push(`<!--[-->`);
          const each_array = ensure_array_like(voices);
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let v = each_array[$$index];
            $$renderer3.option(
              { value: v.name, class: "" },
              ($$renderer4) => {
                $$renderer4.push(`${escape_html(v.name)} (${escape_html(v.lang)})`);
              },
              "svelte-d580bl"
            );
          }
          $$renderer3.push(`<!--]-->`);
        },
        "svelte-d580bl"
      );
      $$renderer2.push(`</label> <label class="field svelte-d580bl"><span class="svelte-d580bl">Speed: ${escape_html(store_get($$store_subs ??= {}, "$settings", settings).speechRate.toFixed(1))}x</span> <input type="range" min="0.5" max="2" step="0.1"${attr("value", store_get($$store_subs ??= {}, "$settings", settings).speechRate)} class="svelte-d580bl"/></label> <label class="field svelte-d580bl"><span class="svelte-d580bl">Pitch: ${escape_html(store_get($$store_subs ??= {}, "$settings", settings).speechPitch.toFixed(1))}</span> <input type="range" min="0.5" max="2" step="0.1"${attr("value", store_get($$store_subs ??= {}, "$settings", settings).speechPitch)} class="svelte-d580bl"/></label> <label class="field svelte-d580bl"><span class="svelte-d580bl">Volume: ${escape_html(Math.round(store_get($$store_subs ??= {}, "$settings", settings).speechVolume * 100))}%</span> <input type="range" min="0" max="1" step="0.1"${attr("value", store_get($$store_subs ??= {}, "$settings", settings).speechVolume)} class="svelte-d580bl"/></label></div> <div class="section svelte-d580bl"><h4 class="svelte-d580bl">Speech Input</h4> <label class="field svelte-d580bl"><span class="svelte-d580bl">Language</span> `);
      $$renderer2.select(
        {
          value: store_get($$store_subs ??= {}, "$settings", settings).language,
          class: ""
        },
        ($$renderer3) => {
          $$renderer3.option(
            { value: "en-GB", class: "" },
            ($$renderer4) => {
              $$renderer4.push(`English (UK) - Jarvis default`);
            },
            "svelte-d580bl"
          );
          $$renderer3.option(
            { value: "en-US", class: "" },
            ($$renderer4) => {
              $$renderer4.push(`English (US)`);
            },
            "svelte-d580bl"
          );
          $$renderer3.option(
            { value: "hi-IN", class: "" },
            ($$renderer4) => {
              $$renderer4.push(`Hindi`);
            },
            "svelte-d580bl"
          );
          $$renderer3.option(
            { value: "es-ES", class: "" },
            ($$renderer4) => {
              $$renderer4.push(`Spanish`);
            },
            "svelte-d580bl"
          );
          $$renderer3.option(
            { value: "fr-FR", class: "" },
            ($$renderer4) => {
              $$renderer4.push(`French`);
            },
            "svelte-d580bl"
          );
          $$renderer3.option(
            { value: "de-DE", class: "" },
            ($$renderer4) => {
              $$renderer4.push(`German`);
            },
            "svelte-d580bl"
          );
          $$renderer3.option(
            { value: "ja-JP", class: "" },
            ($$renderer4) => {
              $$renderer4.push(`Japanese`);
            },
            "svelte-d580bl"
          );
        },
        "svelte-d580bl"
      );
      $$renderer2.push(`</label> <div class="info-box svelte-d580bl">Mic runs in <strong class="svelte-d580bl">continuous mode</strong> - it keeps listening until you manually click the mic button to stop.</div></div> <div class="section svelte-d580bl"><h4 class="svelte-d580bl">Camera / Vision</h4> <div class="info-box svelte-d580bl">When camera is enabled, N.O.V.A. can see you through your webcam. It sends a snapshot with each message to an Ollama vision model (llava). Toggle the camera from the main screen.</div></div> <div class="section svelte-d580bl"><button class="reset-btn svelte-d580bl">Reset to defaults</button></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function StatusIndicator($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let status = { server: false, deepseek: false };
    $$renderer2.push(`<div class="status-bar svelte-193vlpn"><div${attr_class("indicator svelte-193vlpn", void 0, { "ok": status.server, "error": false })}><span class="dot svelte-193vlpn"></span> <span>Server</span></div> <div${attr_class("indicator svelte-193vlpn", void 0, {
      "ok": status.deepseek,
      "error": false
    })}><span class="dot svelte-193vlpn"></span> <span>DeepSeek</span></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function createCameraStore() {
  const { subscribe, update } = writable({
    enabled: false,
    stream: null,
    hasPermission: false,
    error: null
  });
  return {
    subscribe,
    setEnabled(val) {
      update((s) => ({ ...s, enabled: val }));
    },
    setStream(stream) {
      update((s) => ({ ...s, stream, hasPermission: !!stream }));
    },
    setError(err) {
      update((s) => ({ ...s, error: err }));
    }
  };
}
const camera = createCameraStore();
function stopCamera() {
  camera.setStream(null);
  camera.setEnabled(false);
}
function captureFrame(videoElement) {
  if (!videoElement || videoElement.readyState < 2) return null;
  const canvas = document.createElement("canvas");
  canvas.width = videoElement.videoWidth || 640;
  canvas.height = videoElement.videoHeight || 480;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
  return dataUrl.split(",")[1];
}
function CameraFeed($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let compact = fallback($$props["compact"], false);
    onDestroy(() => {
      stopCamera();
    });
    $$renderer2.push(`<div${attr_class("camera-wrapper svelte-1auw75p", void 0, {
      "compact": compact,
      "active": store_get($$store_subs ??= {}, "$camera", camera).enabled
    })}>`);
    if (store_get($$store_subs ??= {}, "$camera", camera).enabled) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<video autoplay="" playsinline="" muted="" class="camera-feed svelte-1auw75p"></video> <div class="camera-overlay svelte-1auw75p"><div class="scan-line svelte-1auw75p"></div> <div class="corner tl svelte-1auw75p"></div> <div class="corner tr svelte-1auw75p"></div> <div class="corner bl svelte-1auw75p"></div> <div class="corner br svelte-1auw75p"></div> <span class="camera-label svelte-1auw75p">LIVE</span></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="camera-off svelte-1auw75p"><svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" class="svelte-1auw75p"><path d="M18 10.48V6c0-1.1-.9-2-2-2H6.83l2 2H16v7.17l2 2v-4.69zm-1.41 9.93l1.41-1.41L3.41 4.41 2 5.82l1 1V18c0 1.1.9 2 2 2h12.17l1.42 1.41zM5 18V8.83L13.17 17H5z" class="svelte-1auw75p"></path></svg> <span class="svelte-1auw75p">Camera Off</span></div>`);
    }
    $$renderer2.push(`<!--]--> <button${attr_class("camera-toggle svelte-1auw75p", void 0, {
      "on": store_get($$store_subs ??= {}, "$camera", camera).enabled
    })}${attr("title", store_get($$store_subs ??= {}, "$camera", camera).enabled ? "Disable camera" : "Enable camera")}${attr("aria-label", store_get($$store_subs ??= {}, "$camera", camera).enabled ? "Disable camera" : "Enable camera")}>`);
    if (store_get($$store_subs ??= {}, "$camera", camera).enabled) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" class="svelte-1auw75p"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" class="svelte-1auw75p"></path></svg>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" class="svelte-1auw75p"><path d="M18 10.48V6c0-1.1-.9-2-2-2H6.83l2 2H16v7.17l2 2v-4.69zm-1.41 9.93l1.41-1.41L3.41 4.41 2 5.82l1 1V18c0 1.1.9 2 2 2h12.17l1.42 1.41zM5 18V8.83L13.17 17H5z" class="svelte-1auw75p"></path></svg>`);
    }
    $$renderer2.push(`<!--]--></button> `);
    if (store_get($$store_subs ??= {}, "$camera", camera).error) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="camera-error svelte-1auw75p">${escape_html(store_get($$store_subs ??= {}, "$camera", camera).error)}</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
    bind_props($$props, { compact });
  });
}
let socket = null;
const listeners = /* @__PURE__ */ new Map();
function connect() {
  if (socket?.connected) return socket;
  const backendUrl = void 0;
  socket = io(backendUrl, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1e3,
    reconnectionAttempts: 10
  });
  socket.on("connect", () => {
    emit("status", { connected: true });
  });
  socket.on("disconnect", () => {
    emit("status", { connected: false });
  });
  socket.on("ai_response_start", (data) => emit("start", data));
  socket.on("ai_response_chunk", (data) => emit("chunk", data));
  socket.on("ai_response_complete", (data) => emit("complete", data));
  socket.on("error", (data) => emit("error", data));
  return socket;
}
function sendMessage(message, conversationId, image = null, userId = null) {
  if (!socket?.connected) {
    connect();
  }
  socket.emit("chat_message", { message, conversationId, image, userId });
}
function emit(event, data) {
  const cbs = listeners.get(event);
  if (cbs) {
    cbs.forEach((cb) => cb(data));
  }
}
function disconnect() {
  socket?.disconnect();
  socket = null;
}
class JarvisProactiveService {
  constructor() {
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.lastInteractionTime = Date.now();
    this.systemChecks = [];
    this.notifications = [];
    this.adviceQueue = [];
  }
  startMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.lastInteractionTime = Date.now();
    this.monitoringInterval = setInterval(() => {
      this.performSystemCheck();
      this.checkForNotifications();
      this.offerProactiveAssistance();
    }, 3e4);
    this.setupInteractionMonitoring();
  }
  stopMonitoring() {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
  setupInteractionMonitoring() {
    this.conversationUnsubscribe = conversation.subscribe((state) => {
      if (state.messages.length > 0) {
        this.lastInteractionTime = Date.now();
      }
    });
    this.voiceUnsubscribe = voice.subscribe((state) => {
      if (state.isListening || state.isSpeaking) {
        this.lastInteractionTime = Date.now();
      }
    });
  }
  performSystemCheck() {
    const now = Date.now();
    const timeSinceLastInteraction = now - this.lastInteractionTime;
    if (timeSinceLastInteraction > 3e5) {
      this.offerIdleAssistance();
    }
    const hour = (/* @__PURE__ */ new Date()).getHours();
    if (hour >= 6 && hour < 12) {
      this.offerMorningGreeting();
    } else if (hour >= 12 && hour < 17) {
      this.offerAfternoonUpdate();
    } else if (hour >= 17 && hour < 22) {
      this.offerEveningBriefing();
    } else {
      this.offerNightlyStatus();
    }
    this.checkDailyReminders();
  }
  checkForNotifications() {
    const notifications = [];
    if (Math.random() > 0.95) {
      notifications.push({
        type: "system",
        priority: "low",
        message: "System maintenance scheduled for tonight",
        timestamp: Date.now()
      });
    }
    this.notifications = [...this.notifications, ...notifications];
  }
  offerProactiveAssistance() {
    const now = Date.now();
    const timeSinceLastInteraction = now - this.lastInteractionTime;
    if (timeSinceLastInteraction < 1e4) return;
    const hour = (/* @__PURE__ */ new Date()).getHours();
    (/* @__PURE__ */ new Date()).getDay();
    if (timeSinceLastInteraction > 12e4) {
      this.offerIdleSuggestions();
    }
    if (hour === 8 && Math.random() > 0.7) {
      this.addAdvice("Sir, would you like me to prepare your morning briefing?");
    }
    if (hour === 18 && Math.random() > 0.7) {
      this.addAdvice("Sir, shall I prepare tomorrow's schedule overview?");
    }
  }
  offerIdleAssistance() {
    const idleTime = Date.now() - this.lastInteractionTime;
    if (idleTime > 6e5) {
      this.addAdvice("Sir, I notice you've been inactive. Shall I put the system in standby mode?");
    } else if (idleTime > 3e5) {
      this.addAdvice("Sir, would you like a status update on any ongoing processes?");
    }
  }
  offerMorningGreeting() {
    if (Math.random() > 0.8) {
      this.addAdvice("Good morning, sir. The weather is favorable for your commute. Traffic should be light.");
    }
  }
  offerAfternoonUpdate() {
    if (Math.random() > 0.8) {
      this.addAdvice("Good afternoon, sir. I've optimized your system performance and cleared temporary files.");
    }
  }
  offerEveningBriefing() {
    if (Math.random() > 0.8) {
      this.addAdvice("Good evening, sir. Shall I prepare tomorrow's agenda review?");
    }
  }
  offerNightlyStatus() {
    if (Math.random() > 0.8) {
      this.addAdvice("Good evening, sir. System security scan completed. All clear.");
    }
  }
  checkDailyReminders() {
    const now = /* @__PURE__ */ new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    if (hour === 9 && dayOfWeek === 1 && Math.random() > 0.7) {
      this.addAdvice("Sir, today is Monday. Shall I prioritize your weekly planning tasks?");
    }
    if (hour === 17 && dayOfWeek >= 1 && dayOfWeek <= 5 && Math.random() > 0.7) {
      this.addAdvice("Sir, shall I prepare your commute information for departure?");
    }
  }
  offerIdleSuggestions() {
    const suggestions = [
      "Sir, would you like me to optimize system performance?",
      "Shall I check for any pending updates?",
      "Would you like a brief status report on system operations?",
      "Sir, I can adjust your desktop environment if you're taking a break.",
      "Shall I dim the screen to reduce eye strain?"
    ];
    if (Math.random() > 0.6) {
      const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
      this.addAdvice(suggestion);
    }
  }
  addAdvice(advice) {
    this.adviceQueue.push({
      id: Date.now(),
      message: advice,
      timestamp: Date.now(),
      priority: "medium"
    });
    if (this.adviceQueue.length > 5) {
      this.adviceQueue.shift();
    }
  }
  getRecentAdvice() {
    return this.adviceQueue.slice(-3);
  }
  getSystemStatus() {
    return {
      lastInteraction: this.lastInteractionTime,
      isMonitoring: this.isMonitoring,
      notificationCount: this.notifications.length,
      adviceQueueLength: this.adviceQueue.length,
      idleTime: Date.now() - this.lastInteractionTime,
      timeOfDay: this.getTimeOfDay(),
      dayOfWeek: (/* @__PURE__ */ new Date()).getDay()
    };
  }
  getTimeOfDay() {
    const hour = (/* @__PURE__ */ new Date()).getHours();
    if (hour >= 6 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 22) return "evening";
    return "night";
  }
  triggerImmediateAssistance(type, params = {}) {
    switch (type) {
      case "system_status":
        return "Sir, system status: All systems operational. CPU usage at 23%, memory at 45%. No critical alerts.";
      case "security_scan":
        return "Security scan initiated. No threats detected. System remains secure.";
      case "performance_optimize":
        return "Performance optimization complete. System running at peak efficiency.";
      case "schedule_review":
        return "Reviewing your schedule... Upcoming meetings: 2 today, 1 tomorrow. Nothing urgent requires immediate attention.";
      case "commute_info":
        return "Traffic is light. Your usual route should take approximately 25 minutes.";
      default:
        return "Sir, I'm ready to assist. What would you like me to do?";
    }
  }
}
const jarvisProactiveService = new JarvisProactiveService();
function createUserStore() {
  const { subscribe, set, update } = writable({
    userId: null,
    name: "",
    email: ""
  });
  return {
    subscribe,
    setProfile(profile) {
      set({
        userId: profile.id,
        name: profile.name,
        email: profile.email
      });
    }
  };
}
const user = createUserStore();
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let textInput = "";
    let unsubscribers = [];
    function getVideoElement() {
      return document.querySelector(".camera-feed");
    }
    onDestroy(() => {
      unsubscribers.forEach((unsub) => unsub && unsub());
      disconnect();
    });
    async function handleSend(text) {
      if (!text?.trim()) return;
      console.log("handleSend called with text:", text);
      const msg = text.trim();
      textInput = "";
      let currentState;
      conversation.subscribe((s) => currentState = s)();
      conversation.addMessage("user", msg);
      let image = null;
      if (store_get($$store_subs ??= {}, "$camera", camera).enabled) {
        const vid = getVideoElement();
        if (vid) {
          image = captureFrame(vid);
        }
      }
      console.log("Sending message via WebSocket:", msg);
      let currentUser;
      user.subscribe((u) => currentUser = u)();
      sendMessage(msg, currentState.conversationId, image, currentUser.userId);
    }
    function handleVoiceResult(text) {
      handleSend(text);
    }
    onDestroy(() => {
      unsubscribers.forEach((unsub) => unsub && unsub());
      disconnect();
      continuousConversation.stop();
      jarvisProactiveService.stopMonitoring();
    });
    $$renderer2.push(`<div class="app svelte-1uha8ag"><header class="header svelte-1uha8ag"><div class="header-left svelte-1uha8ag"><div class="logo svelte-1uha8ag"><svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 110 2h-1.17A7 7 0 0113 21.93V22h-2v-.07A7 7 0 013.17 16H2a1 1 0 110-2h1a7 7 0 017-7h1V5.73A2 2 0 0112 2z"></path></svg> <span class="logo-text svelte-1uha8ag">N.O.V.A.</span></div> `);
    StatusIndicator($$renderer2);
    $$renderer2.push(`<!----></div> <div class="header-right svelte-1uha8ag"><button class="icon-btn svelte-1uha8ag" title="New conversation"><svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg></button> <button class="icon-btn svelte-1uha8ag" title="Settings"><svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"></path></svg></button></div></header> <div class="main-area svelte-1uha8ag">`);
    if (store_get($$store_subs ??= {}, "$camera", camera).enabled) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="camera-sidebar svelte-1uha8ag">`);
      CameraFeed($$renderer2, { compact: true });
      $$renderer2.push(`<!----></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    ChatWindow($$renderer2);
    $$renderer2.push(`<!----></div> <div class="controls-area svelte-1uha8ag"><div class="controls-top svelte-1uha8ag">`);
    if (!store_get($$store_subs ??= {}, "$camera", camera).enabled) {
      $$renderer2.push("<!--[-->");
      CameraFeed($$renderer2, { compact: true });
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    WaveformAnimation($$renderer2);
    $$renderer2.push(`<!----></div> `);
    VoiceControls($$renderer2, {
      onResult: handleVoiceResult,
      disabled: store_get($$store_subs ??= {}, "$conversation", conversation).isLoading
    });
    $$renderer2.push(`<!----> <div class="text-input-row svelte-1uha8ag"><input type="text" placeholder="Type a message or just speak..."${attr("value", textInput)}${attr("disabled", store_get($$store_subs ??= {}, "$conversation", conversation).isLoading, true)} class="svelte-1uha8ag"/> <button class="send-btn svelte-1uha8ag"${attr("disabled", !textInput.trim() || store_get($$store_subs ??= {}, "$conversation", conversation).isLoading, true)} aria-label="Send message"><svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg></button></div></div> `);
    SettingsPanel($$renderer2);
    $$renderer2.push(`<!----></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
