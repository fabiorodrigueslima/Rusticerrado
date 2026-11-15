# Cria o banco local do RustiCerrado usando os scripts oficiais de database/.
# Lê as credenciais de backend\.env e nunca as imprime.
# Uso (na pasta do projeto):  powershell -ExecutionPolicy Bypass -File scripts\criar-banco-local.ps1
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')
$env:Path = "$env:ProgramFiles\nodejs;$env:Path"
$psql = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'
if (-not (Test-Path $psql)) { throw "psql não encontrado em $psql" }
$envLines = Get-Content backend\.env

$line = $envLines | Where-Object { $_ -like 'DATABASE_URL=*' } | Select-Object -First 1
if ($line -notmatch '^DATABASE_URL=postgresql://rustic_app:([^@]+)@localhost:5432/rusticerrado\s*$') { throw 'DATABASE_URL inesperada em backend\.env' }
$appPw = [uri]::UnescapeDataString($matches[1])

$admin = $envLines | Where-Object { $_ -like 'DATABASE_ADMIN_URL=*' } | Select-Object -First 1
if ($admin -notmatch '^DATABASE_ADMIN_URL=postgresql://postgres:([^@]+)@localhost:5432/rusticerrado\s*$') { throw 'DATABASE_ADMIN_URL inesperada em backend\.env' }
if ($matches[1] -eq 'SENHA_DO_POSTGRES') { throw 'Troque SENHA_DO_POSTGRES pela senha do usuário postgres em backend\.env' }
$env:PGPASSWORD = [uri]::UnescapeDataString($matches[1])
try {
  Write-Host "1/3 Criando papéis e banco..."
  & $psql -X -h localhost -U postgres -v "APP_DB_PASSWORD=$appPw" -f database\database.sql postgres
  if ($LASTEXITCODE) { throw 'Falha em database.sql' }

  Write-Host "2/3 Criando tabelas, índices, dados base e permissões..."
  foreach ($f in 'tables','indexes','seed','permissions') {
    & $psql -X -q -h localhost -U postgres -f "database\$f.sql" rusticerrado
    if ($LASTEXITCODE) { throw "Falha em $f.sql" }
  }

  Write-Host "3/3 Aplicando migrations..."
  npm run db:migrate
  if ($LASTEXITCODE) { throw 'Falha nas migrations' }
  Write-Host "Banco local pronto."
} finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
