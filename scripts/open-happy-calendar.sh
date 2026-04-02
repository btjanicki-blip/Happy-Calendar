#!/bin/zsh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RUNTIME_DIR="$APP_ROOT/.runtime"
INSTALL_LOG="$RUNTIME_DIR/install.log"
DESKTOP_LOG="$RUNTIME_DIR/desktop.log"
BUILD_LOG="$RUNTIME_DIR/build.log"
ELECTRON_BIN="$APP_ROOT/node_modules/.bin/electron"

mkdir -p "$RUNTIME_DIR"

if [[ ! -d "$APP_ROOT/node_modules" || ! -d "$APP_ROOT/client/node_modules" || ! -d "$APP_ROOT/server/node_modules" ]]; then
  npm --prefix "$APP_ROOT" run install:all >"$INSTALL_LOG" 2>&1
fi

if [[ ! -x "$ELECTRON_BIN" ]]; then
  echo "Electron binary not found at $ELECTRON_BIN" >"$DESKTOP_LOG"
  exit 1
fi

npm --prefix "$APP_ROOT" run build >"$BUILD_LOG" 2>&1

exec "$ELECTRON_BIN" "$APP_ROOT" >>"$DESKTOP_LOG" 2>&1
