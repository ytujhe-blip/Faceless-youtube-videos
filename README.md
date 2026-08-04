# Faceless Video Generator

Automated video generation using LLM for scripts, Pexels for stock footage, and FFmpeg for assembly.

## Features

- 🎬 Automatic script generation using LLM
- 🎥 Stock footage search from Pexels (free)
- 🎙️ Text-to-speech voiceover generation
- ✂️ Automatic video assembly with FFmpeg
- 🖥️ Modern React frontend
- 🔧 OpenAI-compatible API support

## Tech Stack

**Backend:**
- FastAPI (Python)
- OpenAI-compatible LLM integration
- Pexels API for stock footage
- gTTS/Edge-TTS for voiceover
- FFmpeg for video processing

**Frontend:**
- React + Vite
- TailwindCSS
- Axios for API calls

## Prerequisites

- Python 3.10+
- Node.js 18+
- FFmpeg
- Pexels API key (free)
- OpenAI-compatible API key

## Installation

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend Setup

```bash
cd frontend
npm install
```

## Configuration

Create `.env` file in backend directory:

```env
LLM_API_KEY=your_openai_compatible_key
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-3.5-turbo
PEXELS_API_KEY=your_pexels_api_key
```

## Running the Application

### Start Backend

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Start Frontend

```bash
cd frontend
npm run dev
```

## Usage

1. Enter a topic for your video
2. The LLM generates a script
3. Scenes are extracted and matched with stock footage
4. Voiceover is generated
5. Video is assembled automatically
6. Download your generated video!

## API Endpoints

- `POST /api/generate`: Generate a complete video
- `GET /api/status/{job_id}`: Check generation status
- `GET /api/video/{job_id}`: Download generated video

## License

MIT
