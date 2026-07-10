#!/usr/bin/env bash

set -euo pipefail

log_step() {
  printf "\n🔹 %s\n" "$1"
}

log_success() {
  printf "   ✓ %s\n" "$1"
}

log_error() {
  printf "   ✗ %s\n" "$1" >&2
}

on_error() {
  local exit_code=$?

  printf "\n"
  log_error "Installation failed with exit code ${exit_code}"
  printf "Check the error output above and run the script again.\n"

  exit "$exit_code"
}

trap on_error ERR

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

printf "🚀 Installing claude-provider-statusline...\n"

log_step "Checking required tools"

if ! command_exists node; then
  log_error "Node.js is not installed"
  exit 1
fi
log_success "Node.js: $(node --version)"

if ! command_exists pnpm; then
  log_error "pnpm is not installed"
  printf "Install it with:\n"
  printf "  corepack enable\n"
  printf "  corepack prepare pnpm@latest --activate\n"
  exit 1
fi
log_success "pnpm: $(pnpm --version)"

if ! command_exists npm; then
  log_error "npm is not installed"
  exit 1
fi
log_success "npm: $(npm --version)"

log_step "Installing project dependencies"
pnpm install
log_success "Dependencies installed"

log_step "Running TypeScript checks"
pnpm typecheck
log_success "TypeScript checks passed"

log_step "Running tests"
pnpm test
log_success "All tests passed"

log_step "Building package with tsup"
pnpm build
log_success "Build completed"

if [[ ! -f "dist/cli.js" ]]; then
  log_error "Build output dist/cli.js was not created"
  exit 1
fi
log_success "CLI output found: dist/cli.js"

log_step "Creating global npm link"
npm link
log_success "Global command linked"

if ! command_exists claude-provider-statusline; then
  log_error "Global command claude-provider-statusline was not found"
  printf "Your npm global bin directory may not be in PATH.\n"
  printf "Check it with:\n"
  printf "  npm prefix -g\n"
  exit 1
fi
log_success "Command available: $(command -v claude-provider-statusline)"

log_step "Configuring Claude Code status line"
claude-provider-statusline setup

printf "\n"
printf "🎉 Installation completed successfully.\n"
printf "\n"
printf "Verify the installation with:\n"
printf "  claude-provider-statusline doctor\n"
printf "\n"
printf "Then restart Claude Code.\n"
