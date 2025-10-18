Add-Type -AssemblyName presentationCore
$mediaPlayer = New-Object System.Windows.Media.MediaPlayer
$mediaPlayer.Open([uri]"C:\Users\User\Documents\GitHub\cks-portal\test-fixed.mp3")
$mediaPlayer.Play()
Start-Sleep -Seconds 5
$mediaPlayer.Stop()
$mediaPlayer.Close()
