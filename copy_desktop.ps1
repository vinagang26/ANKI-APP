$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$AppExe = Join-Path $PSScriptRoot "dist\ChineseAnki.exe"
$Desktop = [System.Environment]::GetFolderPath('Desktop')
$DestExe = Join-Path $Desktop "Chinese Flashcards.exe"

if (Test-Path $AppExe) {
    Copy-Item -Path $AppExe -Destination $DestExe -Force

    $WshShell = New-Object -ComObject WScript.Shell
    $ShortcutPath = Join-Path $Desktop "Chinese Flashcards.lnk"
    $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
    $Shortcut.TargetPath = "$AppExe"
    $Shortcut.WorkingDirectory = (Join-Path $PSScriptRoot "dist")
    $Shortcut.Description = "Chinese Vocab Liquid Glass Anki Desktop App"
    $Shortcut.Save()

    Write-Host "Desktop app updated successfully at: $DestExe"
} else {
    Write-Host "Could not find $AppExe"
}
