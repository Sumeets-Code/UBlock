#!/usr/bin/env bash
# UBlock Face Recognition Service — start script
# Run from the face-service/ directory: bash start.sh

set -e
cd "$(dirname "$0")"

echo "=== UBlock Face Recognition Service ==="
echo ""

# 1. Check Python
if ! command -v python3 &>/dev/null; then
  echo "ERROR: python3 not found. Install Python 3.10+ from https://python.org"
  exit 1
fi
echo "Python: $(python3 --version)"

# 2. Create venv if missing
if [ ! -d ".venv" ]; then
  echo ""
  echo "Creating virtual environment..."
  python3 -m venv .venv
fi

# 3. Activate
.venv/Scripts/activate

# 4. Install deps (skip if already installed)
if ! python -c "import facenet_pytorch" 2>/dev/null; then
  echo ""
  echo "Installing dependencies (first time: ~5 min, downloads PyTorch + models)..."
  pip install --upgrade pip -q
  pip install -r requirements.txt -q
  echo "Installation complete."
fi

# 5. Pre-download model weights so first request is instant
echo ""
echo "Checking model weights..."
python - << 'PYEOF'
try:
    from facenet_pytorch import MTCNN, InceptionResnetV1
    MTCNN()
    InceptionResnetV1(pretrained='vggface2')
    print("Models ready.")
except Exception as e:
    print(f"Model check failed: {e}")
    print("Models will download on first request instead.")
PYEOF

# 6. Ensure data dir exists
mkdir -p data/faces

# 7. Warn if secret not changed
if grep -q "CHANGE_ME_TO_A_STRONG_RANDOM_STRING" .env 2>/dev/null; then
  echo ""
  echo "WARNING: SERVICE_SECRET is still the default value in .env"
  echo "         Generate a real secret:"
  echo "         python -c \"import secrets; print(secrets.token_hex(32))\""
  echo "         Then set it in BOTH face-service/.env AND api/.env (FACE_SERVICE_SECRET)"
fi

echo ""
echo "Starting face recognition service on http://localhost:8000 ..."
echo "API docs: http://localhost:8000/docs"
echo ""

uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1 --reload


# Final Run this:
uvicorn app.main:app --port 8000
