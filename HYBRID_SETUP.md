# Hybrid AI Assistant - Remote Access Setup Guide

## Overview
Transform your local AI assistant into a hybrid system that runs locally on your laptop but can be accessed from any device, anywhere.

## Features
- ✅ **Local Processing**: Primary AI runs on your laptop with Ollama
- ✅ **Remote Access**: Secure access from other devices
- ✅ **Privacy First**: Your data stays private when accessed locally
- ✅ **Flexible Access**: Multiple methods to access from anywhere
- ✅ **Secure Authentication**: API key protection for remote access

## Access Methods

### 1. Local Network Access (Same WiFi)
- Access from phones/computers on the same network
- Best performance, no internet required
- Automatically secured (no authentication needed locally)

### 2. Port Forwarding (Direct Internet Access)
- Configure your router to forward port 3001
- Access from anywhere using your public IP
- Requires router configuration knowledge

### 3. Cloudflare Tunnel (Recommended)
- Secure tunnel without router configuration
- Free and easy to set up
- Recommended for most users

### 4. VPN Access
- Connect to your home VPN first
- Then access the local address
- Maximum security

## Setup Instructions

### Step 1: Prepare Your Laptop
1. Ensure Ollama is running: `ollama serve`
2. Pull required models: `ollama pull llama3` (and other models you use)
3. Run the deployment script: `powershell -ExecutionPolicy Bypass -File deploy.ps1`

### Step 2: Choose Access Method

#### Option A: Cloudflare Tunnel (Recommended)
1. Install Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
2. Log in: `cloudflared tunnel login`
3. Create tunnel: `cloudflared tunnel create ai-assistant`
4. Update your Cloudflare DNS to point to the tunnel
5. Run: `cloudflared tunnel --url http://localhost:3001`

#### Option B: Port Forwarding
1. Access your router's admin panel
2. Find "Port Forwarding" settings
3. Forward external port 3001 to your laptop's IP on port 3001
4. Use your public IP address to access from outside your network

#### Option C: Local Network Only
1. Use your laptop's local IP address (e.g., 192.168.1.100:3001)
2. Access from other devices on the same WiFi

### Step 3: Access from Other Devices

#### Mobile App Example (using cURL or a REST client):
```bash
curl -X POST https://your-tunnel.trycloudflare.com/api/chat \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY_FROM_DEPLOY_SCRIPT" \
  -d '{"message": "Hello!", "conversationId": "123"}'
```

#### Browser Access:
1. Open a browser on any device
2. Navigate to your chosen access method URL
3. The interface will be the same as on your laptop

## Security Features

### API Key Authentication
- Required for all remote access
- Automatically skipped for local network access
- Highly recommended to change periodically

### Rate Limiting
- Prevents abuse and DoS attacks
- Configured to allow normal usage patterns

### CORS Protection
- Only allows requests from trusted domains
- Configurable in environment variables

### Content Security Policy
- Protects against XSS attacks
- Secure by default

## Troubleshooting

### Common Issues:
1. **"Connection refused"**: Check if the backend service is running
2. **"Authentication error"**: Verify your API key is correct
3. **"CORS error"**: Check ALLOWED_ORIGINS in .env file
4. **"Ollama not found"**: Ensure Ollama is running on your laptop

### Checking Status:
```bash
# Check if backend is running
curl http://localhost:3001/api/health

# Check if Ollama is running  
curl http://localhost:11434/api/tags
```

## Performance Tips

- Keep your laptop awake when accessing remotely
- Use wired connection for best local performance
- Close unnecessary applications to preserve resources
- Consider using a dedicated machine for 24/7 access

## Privacy Notice
- All processing happens on your laptop
- Conversations are only transmitted when using remote access
- No data is stored in the cloud (unless you configure it)
- You maintain complete control over your AI assistant

## Advanced Configuration

Edit `.env` file to customize:
- `REMOTE_ACCESS_ENABLED`: Enable/disable remote access
- `AUTH_REQUIRED`: Require API key for all access
- `API_KEY`: The authentication key
- `ALLOWED_ORIGINS`: Domains allowed to access the API
- `BACKEND_PORT`: Port the service runs on

## Maintenance

- Restart the service after system updates
- Rotate your API key periodically
- Monitor resource usage
- Backup your conversation data if desired

---

Your hybrid AI assistant is now ready! Enjoy the flexibility of having your personal AI accessible from any device while maintaining the privacy and power of local processing.