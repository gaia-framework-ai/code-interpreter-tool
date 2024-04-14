FROM python:3.9-slim

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y --no-install-recommends \
    xvfb \
    libfontconfig \
    libfreetype6 \
    xfonts-75dpi \
    xauth \
    xfonts-base \
    wget \
    gnupg \
    ffmpeg \
    apt-transport-https \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8888

CMD ["tail", "-f", "/dev/null"]