param([switch]$SkipBuild)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$root = $PSScriptRoot
$out = Join-Path $root 'release'
$bundle = 'shattered_casino'

$packages = @(
    @{
        Name = 'shattered_casino'
        Source = @('shattered_casino', 'casino')
        Exclude = @(
            '.git', '.gitignore', '.vscode', '.idea',
            'web/node_modules', 'web/src', 'web/public',
            'web/index.html', 'web/slots.html', 'web/package.json', 'web/bun.lock',
            'web/package-lock.json', 'web/tsconfig.json', 'web/vite.config.ts'
        )
    },
    @{
        Name = 'shattered_casino_props'
        Source = @('shattered_casino_props', 'casinoslots')
        Exclude = @('.git', '.gitignore')
    }
)

function Get-PackageFiles([string]$dir, [string]$rel, [string[]]$exclude) {
    foreach ($item in Get-ChildItem -LiteralPath $dir -Force) {
        $path = if ($rel) { "$rel/$($item.Name)" } else { $item.Name }
        if ($exclude -contains $path) { continue }
        if ($item.Name -eq 'Thumbs.db' -or $item.Name -eq '.DS_Store') { continue }
        if ($item.PSIsContainer) { Get-PackageFiles $item.FullName $path $exclude }
        else { [pscustomobject]@{ Full = $item.FullName; Rel = $path; Size = $item.Length } }
    }
}

function Resolve-Source($pkg) {
    foreach ($name in $pkg.Source) {
        $dir = Join-Path $root $name
        if (Test-Path -LiteralPath (Join-Path $dir 'fxmanifest.lua')) { return $dir }
    }
    throw "no folder with an fxmanifest.lua found for $($pkg.Name) (looked for $($pkg.Source -join ', '))"
}

foreach ($pkg in $packages) { $pkg.Dir = Resolve-Source $pkg }

if (-not $SkipBuild) {
    $web = Join-Path $packages[0].Dir 'web'
    Push-Location -LiteralPath $web
    try {
        if (-not (Test-Path -LiteralPath (Join-Path $web 'node_modules'))) {
            bun install --frozen-lockfile
            if ($LASTEXITCODE -ne 0) { throw 'bun install failed' }
        }
        bun run build
        if ($LASTEXITCODE -ne 0) { throw 'web build failed' }
    }
    finally { Pop-Location }
}

[IO.Directory]::CreateDirectory($out) | Out-Null
$zip = Join-Path $out "$bundle.zip"
if (Test-Path -LiteralPath $zip) { Remove-Item -LiteralPath $zip -Force }

$stream = [IO.File]::Open($zip, [IO.FileMode]::CreateNew)
$archive = [IO.Compression.ZipArchive]::new($stream, [IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($pkg in $packages) {
        $files = @(Get-PackageFiles $pkg.Dir '' $pkg.Exclude)
        foreach ($file in $files) {
            [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $file.Full, "$($pkg.Name)/$($file.Rel)", [IO.Compression.CompressionLevel]::Optimal) | Out-Null
        }
        '{0,-24} {1,5} files  {2,7:N1} MB  from {3}' -f $pkg.Name, $files.Count, (($files | Measure-Object Size -Sum).Sum / 1MB), $pkg.Dir
    }
}
finally {
    $archive.Dispose()
    $stream.Dispose()
}

'{0,-24} {1,7:N1} MB  {2}' -f "$bundle.zip", ((Get-Item -LiteralPath $zip).Length / 1MB), $zip
