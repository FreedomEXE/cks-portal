param(
    [string]$AudioFile = "test-voice-output.mp3"
)

Write-Host "Testing audio playback of: $AudioFile" -ForegroundColor Cyan

if (-not (Test-Path $AudioFile)) {
    Write-Host "ERROR: Audio file not found: $AudioFile" -ForegroundColor Red
    exit 1
}

try {
    Add-Type -AssemblyName presentationCore
    $mediaPlayer = New-Object System.Windows.Media.MediaPlayer
    $fullPath = (Resolve-Path $AudioFile).Path

    Write-Host "Loading audio from: $fullPath" -ForegroundColor Yellow
    $mediaPlayer.Open([uri]$fullPath)

    Write-Host "Playing audio..." -ForegroundColor Green
    $mediaPlayer.Play()

    # Wait 5 seconds for playback
    Start-Sleep -Seconds 5

    Write-Host "Stopping playback" -ForegroundColor Yellow
    $mediaPlayer.Stop()
    $mediaPlayer.Close()

    Write-Host "Playback test complete!" -ForegroundColor Green
} catch {
    Write-Host "ERROR during playback: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
