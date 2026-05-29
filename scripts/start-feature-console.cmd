@echo off
cd /d "%~dp0.."
set PORT=3100
set DATABASE_URL=file:./prisma/dev.db
set JWT_SECRET=churchos-dev-secret-change-in-production
set VAULT_SECRET=churchos-vault-secret-change-in-production
"C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" scripts\local-feature-server.js
pause
