import { camera } from '../stores/camera.js';

let videoStream = null;

export async function startCamera() {
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
    });
    camera.setStream(videoStream);
    camera.setEnabled(true);
    return videoStream;
  } catch (err) {
    camera.setError('Camera access denied. Please allow camera permissions.');
    return null;
  }
}

export function stopCamera() {
  if (videoStream) {
    videoStream.getTracks().forEach((t) => t.stop());
    videoStream = null;
  }
  camera.setStream(null);
  camera.setEnabled(false);
}

/**
 * Capture a single frame from a <video> element as base64 JPEG.
 * Returns the raw base64 string (no data URI prefix) for Ollama.
 */
export function captureFrame(videoElement) {
  if (!videoElement || videoElement.readyState < 2) return null;

  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth || 640;
  canvas.height = videoElement.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  // Return raw base64 (strip the data:image/jpeg;base64, prefix)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
  return dataUrl.split(',')[1];
}

export function isSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
