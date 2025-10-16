# Response Notification with Modern Neural TTS (edge-tts)
param(
    [string]$Message = "Response ready",
    [string]$Voice = "en-GB-LibbyNeural"  # Options: LibbyNeural, MaisieNeural, SoniaNeural
)

# Random greeting selection
$greetings = @(
    "Hello Freedom",
    "Hello Daddy",
    "Hey Freedom",
    "Hi Daddy",
    "Greetings Freedom",
    "What's up Daddy"
)
$greeting = $greetings | Get-Random
$fullMessage = "$greeting. $Message"

Write-Host "[Voice] Using modern neural voice: $Voice" -ForegroundColor Cyan
Write-Host "[Speaking] $fullMessage" -ForegroundColor Green

# Generate temp audio file
$tempAudio = [System.IO.Path]::GetTempFileName() -replace '\.tmp$', '.mp3'

try {
    # Generate speech with edge-tts
    python -m edge_tts --voice $Voice --text $fullMessage --write-media $tempAudio 2>&1 | Out-Null

    if (Test-Path $tempAudio) {
        # Play audio (Windows Media Player)
        $player = New-Object System.Media.SoundPlayer

        # Use PowerShell to play MP3
        Add-Type -AssemblyName presentationCore
        $mediaPlayer = New-Object System.Windows.Media.MediaPlayer
        $mediaPlayer.Open([uri]$tempAudio)
        $mediaPlayer.Play()

        # Wait for audio to finish (estimate based on text length with generous buffer)
        $estimatedDuration = [Math]::Max(5, ($fullMessage.Length / 8))  # ~8 chars per second + buffer
        Start-Sleep -Seconds $estimatedDuration

        $mediaPlayer.Stop()
        $mediaPlayer.Close()

        # Play system sound after speech
        [System.Media.SystemSounds]::Asterisk.Play()
    } else {
        Write-Host "[ERROR] Failed to generate speech" -ForegroundColor Red
        # Fallback to system beep
        [console]::beep(800, 300)
    }
} catch {
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "[INFO] Make sure Python and edge-tts are installed. Run: .\scripts\setup-modern-voice.ps1" -ForegroundColor Yellow
    [console]::beep(800, 300)
} finally {
    # Cleanup
    if (Test-Path $tempAudio) {
        Start-Sleep -Milliseconds 500
        Remove-Item $tempAudio -ErrorAction SilentlyContinue
    }
}
