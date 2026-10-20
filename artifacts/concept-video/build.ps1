$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot 'narrate.ps1')
& 'C:/Program Files/nodejs/node.exe' (Join-Path $PSScriptRoot 'render.cjs')
if ($LASTEXITCODE -ne 0) { throw 'Concept walkthrough rendering failed.' }
