FROM python:3.11-slim

WORKDIR /app

# System deps for image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx libglib2.0-0 libsm6 libxext6 libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Pre-download model weights so first request is not slow
RUN python -c "from facenet_pytorch import MTCNN, InceptionResnetV1; MTCNN(); InceptionResnetV1(pretrained='vggface2')" 2>/dev/null || true

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
