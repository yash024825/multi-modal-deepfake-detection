# Node.js base image + Python installed alongside it, since server.js
# spawns `python main.py <file>` for inference.
FROM node:20-slim

# System deps: python3/pip, plus libs opencv/librosa need at runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip \
    libgl1 libglib2.0-0 ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first (better layer caching on rebuilds)
COPY requirements.txt ./
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# Install Node deps
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the backend (app/, evaluate.py, etc.)
COPY . .

ENV PYTHON_PATH=python3
# Render/Fly/Cloud Run inject PORT automatically; 10000 is just a sane default
ENV PORT=10000
EXPOSE 10000

CMD ["node", "server.js"]