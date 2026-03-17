#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# setup.sh  —  One-shot setup for ATS Resume Analyzer on Ubuntu WSL2
# Usage:  bash setup.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

info()    { echo -e "${CYAN}▶ $*${NC}"; }
success() { echo -e "${GREEN}✓ $*${NC}"; }
warn()    { echo -e "${YELLOW}⚠ $*${NC}"; }

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗"
echo -e "║   ATS Resume Analyzer — WSL2 Setup      ║"
echo -e "╚══════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Check if Docker is available ──────────────────────────────────────────
info "Checking Docker..."
if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
  success "Docker is available ($(docker --version | cut -d' ' -f3 | tr -d ','))"
  HAS_DOCKER=true
else
  warn "Docker not found or not running. Will use Python fallback."
  HAS_DOCKER=false
fi

# ── 2. Git setup ──────────────────────────────────────────────────────────────
info "Checking Git..."
if command -v git &>/dev/null; then
  success "Git is available ($(git --version | cut -d' ' -f3))"
else
  info "Installing Git..."
  sudo apt-get update -qq && sudo apt-get install -y git
  success "Git installed"
fi

# ── 3. Init git repo if not already ──────────────────────────────────────────
if [ ! -d ".git" ]; then
  info "Initialising Git repository..."
  git init
  git add .
  git commit -m "feat: initial ATS Resume Analyzer"
  success "Git repo initialised with first commit"
else
  success "Git repo already initialised"
fi

# ── 4. Start app ─────────────────────────────────────────────────────────────
echo ""
if [ "$HAS_DOCKER" = true ]; then
  info "Starting with Docker Compose on http://localhost:3000 ..."
  docker compose up --build -d
  echo ""
  success "App is running at http://localhost:3000"
  echo ""
  echo "  Useful commands:"
  echo "    docker compose logs -f      # stream logs"
  echo "    docker compose down         # stop"
  echo "    docker compose up --build   # rebuild after edits"
else
  info "Starting with Python HTTP server on http://localhost:3000 ..."
  cd public
  python3 -m http.server 3000 &
  SERVER_PID=$!
  cd ..
  echo ""
  success "App is running at http://localhost:3000  (PID $SERVER_PID)"
  echo "  Press Ctrl+C to stop, or kill $SERVER_PID"
fi

# ── 5. GitHub remote instructions ────────────────────────────────────────────
echo ""
echo -e "${YELLOW}══════════════════════════════════════════════${NC}"
echo -e "${YELLOW} Next: push to GitHub${NC}"
echo -e "${YELLOW}══════════════════════════════════════════════${NC}"
echo ""
echo "  1. Create a new repo at https://github.com/new"
echo "     Name: ats-resume-analyzer"
echo ""
echo "  2. Run:"
echo "     git remote add origin https://github.com/YOUR_USERNAME/ats-resume-analyzer.git"
echo "     git branch -M main"
echo "     git push -u origin main"
echo ""
echo "  3. Deploy to Vercel free:"
echo "     → Go to https://vercel.com → Import Git Repository"
echo "     → Select ats-resume-analyzer → Deploy"
echo "     → Live in ~30 seconds!"
echo ""
