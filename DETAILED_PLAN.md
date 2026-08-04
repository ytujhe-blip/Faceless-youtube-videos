# Faceless Video Generator - Detailed Plan

## Project Overview

A full-stack application that automatically generates faceless YouTube-style videos using:
- **LLM** for script generation (OpenAI-compatible API)
- **Pexels** for free stock footage
- **Edge-TTS** for free text-to-speech voiceover
- **FFmpeg** for video assembly

This is inspired by projects like Open Montage and Money Printer Turbo but uses only FREE services.

---

## Architecture

### Tech Stack

**Backend:**
- FastAPI (Python web framework)
- OpenAI Python SDK (for LLM integration)
- Edge-TTS (Microsoft's free TTS service)
- FFmpeg (video processing)
- Requests (HTTP client for Pexels API)

**Frontend:**
- React 18 with Vite
- TailwindCSS for styling
- Axios for API calls

**Infrastructure:**
- Local file storage for temp files and outputs
- In-memory job tracking (can be upgraded to Redis/DB)

---

## Core Components

### 1. Script Generator (`script_generator.py`)
- Uses LLM to generate video scripts
- Returns structured JSON with scenes
- Each scene includes:
  - Narration text
  - Visual description
  - Search keywords for stock footage
  - Duration

### 2. Pexels Service (`pexels_service.py`)
- Searches Pexels API for stock videos
- Finds best matching video for each scene
- Downloads HD quality videos
- Handles fallback if exact match not found

### 3. Voiceover Service (`voiceover_service.py`)
- Uses Edge-TTS (free Microsoft service)
- Generates natural-sounding voiceovers
- Supports multiple voices
- Calculates audio duration for timing

### 4. Video Editor (`video_editor.py`)
- Downloads stock videos from Pexels URLs
- Combines video clips with voiceovers
- Loops/trims videos to match audio duration
- Concatenates all scenes into final video
- Cleans up temporary files

### 5. API Server (`main.py`)
- RESTful API endpoints
- Background task processing
- Job status tracking
- Video download endpoint

---

## Workflow

1. **User Input**: User enters topic and desired duration
2. **Script Generation**: LLM creates script with 4-8 scenes
3. **Stock Footage Search**: For each scene, search Pexels using keywords
4. **Video Download**: Download selected stock videos
5. **Voiceover Generation**: Create TTS audio for each scene narration
6. **Scene Assembly**: Combine video + audio for each scene
7. **Final Compilation**: Concatenate all scenes
8. **Delivery**: User downloads final MP4 video

---

## File Structure

```
/workspace/
├── README.md
├── backend/
│   ├── main.py              # FastAPI server
│   ├── config.py            # Configuration settings
│   ├── script_generator.py  # LLM script generation
│   ├── pexels_service.py    # Pexels API integration
│   ├── voiceover_service.py # Edge-TTS integration
│   ├── video_editor.py      # FFmpeg video processing
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main React component
│   │   ├── main.jsx         # React entry point
│   │   └── index.css        # TailwindCSS styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
├── temp_audio/              # Temporary audio files
├── temp_video/              # Temporary video files
├── output_videos/           # Final generated videos
└── jobs/                    # Job metadata storage
```

---

## API Endpoints

### POST /api/generate
Start video generation process
```json
{
  "topic": "Benefits of Meditation",
  "duration_seconds": 60,
  "video_quality": "720p"
}
```

Response:
```json
{
  "job_id": "uuid-string",
  "status": "pending"
}
```

### GET /api/status/{job_id}
Check generation progress
```json
{
  "job_id": "uuid-string",
  "status": "processing",
  "progress": 45,
  "message": "Generating voiceovers..."
}
```

### GET /api/video/{job_id}
Download completed video (binary response)

### GET /api/jobs
List all jobs (admin/debugging)

---

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- FFmpeg installed
- Pexels API key (free at pexels.com/api)
- OpenAI-compatible API key

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Testing Strategy

### Unit Tests
1. **Script Generator Test**
   - Verify JSON structure
   - Test different topics
   - Validate scene count

2. **Pexels Service Test**
   - Test video search
   - Verify video URL extraction
   - Test keyword fallback

3. **Voiceover Service Test**
   - Test audio generation
   - Verify duration calculation
   - Test multiple voices

4. **Video Editor Test**
   - Test video download
   - Verify concatenation
   - Test cleanup

### Integration Tests
1. **End-to-End Flow**
   - Complete video generation
   - Verify output file exists
   - Check video quality

2. **API Tests**
   - Test all endpoints
   - Verify error handling
   - Test concurrent jobs

### Manual Testing Checklist
- [ ] Enter topic and generate video
- [ ] Monitor progress updates
- [ ] Download completed video
- [ ] Verify video plays correctly
- [ ] Check audio sync with video
- [ ] Test with different durations
- [ ] Test error scenarios (invalid API keys, etc.)

---

## Future Enhancements

### Phase 2 Features
1. **Multiple Voice Options**
   - Male/female voices
   - Different accents
   - Voice cloning

2. **Background Music**
   - Add royalty-free background music
   - Volume mixing
   - Fade in/out effects

3. **Text Overlays**
   - Add subtitles/captions
   - Title cards
   - Lower thirds

4. **Advanced Editing**
   - Transitions between scenes
   - Color correction
   - Zoom/pan effects

5. **Batch Processing**
   - Generate multiple videos
   - Queue management
   - Priority processing

### Phase 3 Features
1. **User Accounts**
   - Save video history
   - Favorite templates
   - Custom branding

2. **Template System**
   - Pre-made video templates
   - Industry-specific styles
   - One-click generation

3. **Social Media Integration**
   - Direct upload to YouTube
   - TikTok/Reels formats
   - Auto-posting

4. **Analytics**
   - Video performance tracking
   - A/B testing
   - Optimization suggestions

---

## Cost Analysis (FREE!)

| Service | Cost | Notes |
|---------|------|-------|
| LLM API | Variable | Depends on provider (can use free tiers) |
| Pexels | FREE | Unlimited API calls |
| Edge-TTS | FREE | Microsoft service |
| FFmpeg | FREE | Open source |
| Hosting | FREE | Can run locally or on free tier |

**Total: $0 for basic usage!**

---

## Troubleshooting

### Common Issues

1. **FFmpeg Not Found**
   ```bash
   # Install FFmpeg
   sudo apt-get install ffmpeg  # Linux
   brew install ffmpeg  # macOS
   ```

2. **Pexels API Error**
   - Check API key is valid
   - Verify rate limits
   - Ensure internet connection

3. **LLM Timeout**
   - Increase timeout in config
   - Use faster model
   - Reduce script complexity

4. **Video Quality Issues**
   - Check downloaded video resolution
   - Verify FFmpeg parameters
   - Ensure sufficient disk space

---

## Security Considerations

1. **API Keys**
   - Never commit .env files
   - Use environment variables
   - Rotate keys regularly

2. **Input Validation**
   - Sanitize user input
   - Limit video duration
   - Prevent path traversal

3. **Rate Limiting**
   - Implement request throttling
   - Protect against abuse
   - Monitor API usage

---

## Performance Optimization

1. **Caching**
   - Cache LLM responses for common topics
   - Store frequently used stock videos
   - Reuse voiceover files

2. **Parallel Processing**
   - Download multiple videos simultaneously
   - Generate voiceovers in parallel
   - Use async/await throughout

3. **Resource Management**
   - Clean up temp files promptly
   - Monitor disk usage
   - Implement job timeouts

---

## Success Metrics

- Video generation time: < 3 minutes for 60s video
- Success rate: > 95%
- User satisfaction: Easy to use interface
- Cost: $0 for personal use

---

## Conclusion

This project provides a complete, production-ready solution for generating faceless videos automatically. It leverages free services to keep costs at zero while maintaining high quality. The modular architecture makes it easy to extend and customize.

**Next Steps:**
1. Set up API keys in `.env`
2. Start backend server
3. Start frontend dev server
4. Generate your first video!

For questions or issues, refer to the troubleshooting section or check the API documentation at `/docs`.
