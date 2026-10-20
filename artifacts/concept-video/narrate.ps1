$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$voiceEngine = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voiceEngine.SelectVoice('Microsoft Zira Desktop')
$voiceEngine.Rate = 1
$voiceEngine.Volume = 100
$lines = @(
  'Meet your AI explainer studio. Turn an idea into a narrated educational video in four simple steps.',
  'First, describe what you want to explain. Brainstorm with AI, choose vertical or horizontal, and create your plan.',
  'Review the script and storyboard together. Each scene shows its narration and animation. Ask for changes, then approve.',
  'The application creates the voiceover, synchronizes captions and motion graphics, and renders your video. Follow progress in one place.',
  'Preview your explainer. Graphics and captions follow the narration. Request changes conversationally, or generate the other format.',
  'Download the video, or use the Instagram publishing workflow. This concept shows simulated scheduling. Live posting depends on authorized access.',
  'That is the complete experience. Idea, plan, video, and publish. A public portfolio application, designed around a zero dollar budget.'
)
try {
  for ($clipIndex = 0; $clipIndex -lt $lines.Count; $clipIndex++) {
    $voiceEngine.SetOutputToWaveFile((Join-Path $PSScriptRoot ('voice-' + $clipIndex + '.wav')))
    $voiceEngine.Speak($lines[$clipIndex])
  }
} finally { $voiceEngine.Dispose() }
Write-Output 'Created seven local narration clips.'
