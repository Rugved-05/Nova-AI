#!/bin/bash
# Deployment script for Hybrid AI Assistant

echo "🚀 Setting up Hybrid AI Assistant for Remote Access..."

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "❌ Ollama is not running. Please start Ollama first."
    exit 1
fi

echo "✅ Ollama is running"

# Create .env file with remote access configuration
cat > .env << EOF
# Remote Access Configuration
REMOTE_ACCESS_ENABLED=true
AUTH_REQUIRED=true
API_KEY=$(openssl rand -hex 32)
ALLOWED_ORIGINS=https://my-ai-assistant.com,https://*.my-ai-assistant.com

# Backend Configuration
BACKEND_PORT=3001
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3
OLLAMA_VISION_MODEL=llava

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173,http://localhost:5174,http://localhost:5175,https://my-ai-assistant.com
EOF

echo "🔐 Generated secure API key for remote access"

# Instructions for the user
echo ""
echo "📋 Deployment Steps:"
echo "1. Make sure Ollama is running on your laptop"
echo "2. Port forward port 3001 on your router to this machine (or use Cloudflare Tunnel)"
echo "3. Update ALLOWED_ORIGINS in .env with your domain"
echo ""
echo "🌐 Access Methods:"
echo "   Local: http://localhost:3001"
echo "   Remote: https://[YOUR_PUBLIC_IP]:3001 (if using port forwarding)"
echo "   Cloudflare: https://[YOUR_TUNNEL].trycloudflare.com (if using Cloudflare Tunnel)"
echo ""
echo "📱 To access from other devices, use the API key in the Authorization header:"
echo "   x-api-key: [GENERATED_API_KEY]"
echo ""
echo "🔒 Security: The API key is stored in .env and required for remote access"
echo "   Change it regularly for better security"