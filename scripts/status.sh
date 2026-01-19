#!/usr/bin/env bash
set -euo pipefail

print_kv() {
  printf "%-26s %s\n" "$1" "$2"
}

codex_config="${CODEX_CONFIG:-$HOME/.codex/config.toml}"
model="unknown"
reasoning_effort="unknown"

if [[ -f "$codex_config" ]]; then
  model="$(awk -F'\"' '/^model =/ {print $2; exit}' "$codex_config" 2>/dev/null || true)"
  reasoning_effort="$(awk -F'\"' '/^model_reasoning_effort =/ {print $2; exit}' "$codex_config" 2>/dev/null || true)"
fi

if [[ -z "$model" ]]; then
  model="unknown"
fi
if [[ -z "$reasoning_effort" ]]; then
  reasoning_effort="unknown"
fi

profile="${CODEX_PROFILE:-unknown}"

codex_version="unknown"
version_file="$HOME/.codex/version.json"
if [[ -f "$version_file" ]]; then
  codex_version="$(sed -n 's/.*"latest_version":"\([^"]*\)".*/\1/p' "$version_file")"
  if [[ -z "$codex_version" ]]; then
    codex_version="unknown"
  fi
fi

sandbox="${CODEX_SANDBOX:-unknown}"
network_disabled="${CODEX_SANDBOX_NETWORK_DISABLED:-unknown}"
cwd="$(pwd)"
repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"

if [[ -z "$repo_root" ]]; then
  repo_root="(not a git repo)"
fi

branch="unknown"
git_status="unknown"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
  if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
    git_status="dirty"
  else
    git_status="clean"
  fi
fi

echo "Codex status (local)"
print_kv "model" "$model"
print_kv "profile" "$profile"
print_kv "model_reasoning_effort" "$reasoning_effort"
print_kv "codex_latest_version" "$codex_version"
print_kv "sandbox" "$sandbox"
print_kv "sandbox_network_disabled" "$network_disabled"
print_kv "shell" "${SHELL:-unknown}"
print_kv "os" "$(uname -srm 2>/dev/null || echo unknown)"
print_kv "cwd" "$cwd"
print_kv "repo_root" "$repo_root"
print_kv "git_branch" "$branch"
print_kv "git_status" "$git_status"
