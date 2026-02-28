Write-Host "🚀 Setting up Hybrid AI Assistant for Remote Access..." -ForegroundColor Green

# Check if Ollama is running
try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 5
    Write-Host "✅ Ollama is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Ollama is not running. Please start Ollama first." -ForegroundColor Red
    exit 1
}

# Generate secure API key
$apiKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})

# Create .env file with remote access configuration
$content = @"
# Remote Access Configuration
REMOTE_ACCESS_ENABLED=true
AUTH_REQUIRED=true
API_KEY=$apiKey
ALLOWED_ORIGINS=https://my-ai-assistant.com,https://*.my-ai-assistant.com

# Backend Configuration
BACKEND_PORT=3001
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3
OLLAMA_VISION_MODEL=llava

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173,http://localhost:5174,http://localhost:5175,https://my-ai-assistant.com
"@

Set-Content -Path ".env" -Value $content

Write-Host "🔐 Generated secure API key for remote access" -ForegroundColor Yellow
Write-Host "Your API key is: $apiKey" -ForegroundColor Cyan

Write-Host "`n📋 Deployment Steps:" -ForegroundColor White
Write-Host "1. Make sure Ollama is running on your laptop"
Write-Host "2. Port forward port 3001 on your router to this machine (or use Cloudflare Tunnel)"
Write-Host "3. Update ALLOWED_ORIGINS in .env with your domain"

Write-Host "`n🌐 Access Methods:" -ForegroundColor White
Write-Host "   Local: http://localhost:3001"
Write-Host "   Remote: https://[YOUR_PUBLIC_IP]:3001 (if using port forwarding)"
Write-Host "   Cloudflare: https://[YOUR_TUNNEL].trycloudflare.com (if using Cloudflare Tunnel)"

Write-Host "`n📱 To access from other devices, use the API key in the Authorization header:" -ForegroundColor White
Write-Host "   x-api-key: $apiKey"

Write-Host "`n🔒 Security: The API key is stored in .env and required for remote access" -ForegroundColor Yellow
Write-Host "   Change it regularly for better security"