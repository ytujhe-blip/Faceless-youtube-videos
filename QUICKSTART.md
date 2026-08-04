# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Get Your API Keys (FREE)

1. **Pexels API Key** (Free - Required)
   - Go to https://www.pexels.com/api/
   - Sign up for free
   - Get your API key

2. **LLM API Key** (Your existing OpenAI-compatible key)
   - Use your existing OpenAI key, or
   - Use any OpenAI-compatible provider (Groq, Together, etc.)

### Step 2: Configure Backend

```bash
cd /workspace/backend
cp .env.example .env
```

Edit `.env` file:
```env
LLM_API_KEY=your_actual_llm_api_key_here
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-3.5-turbo
PEXELS_API_KEY=your_actual_pexels_api_key_here
```

### Step 3: Install Dependencies

**Backend:**
```bash
cd /workspace/backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd /workspace/frontend
npm install
```

### Step 4: Start the Application

**Terminal 1 - Backend:**
```bash
cd /workspace/backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd /workspace/frontend
npm run dev
```

### Step 5: Generate Your First Video!

1. Open http://localhost:3000 in your browser
2. Enter a topic (e.g., "The Benefits of Meditation")
3. Choose duration (30-180 seconds)
4. Click "🚀 Generate Video"
5. Wait for processing (usually 1-3 minutes)
6. Download your video!

---

## 📋 What You Get

✅ **Fully functional video generation app**
✅ **Beautiful modern UI with TailwindCSS**
✅ **Real-time progress tracking**
✅ **Automatic script generation with AI**
✅ **Free stock footage from Pexels**
✅ **Natural voiceover using Edge-TTS**
✅ **Professional video assembly with FFmpeg**
✅ **Zero cost for personal use!**

---

## 🎯 Testing Without API Keys

Want to test the frontend first?

The app will start without API keys, but video generation will fail with an error message. This is expected.

To fully test:
1. Get at least the Pexels API key (it's free and instant)
2. Add your LLM API key
3. Generate a short video (30-60 seconds) for quick testing

---

## 🔧 Troubleshooting

### Backend won't start?
```bash
# Check Python version
python --version  # Should be 3.10+

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Frontend shows blank page?
```bash
# Clear cache and reinstall
cd /workspace/frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### FFmpeg errors?
```bash
# Verify FFmpeg is installed
ffmpeg -version

# Install if needed
sudo apt-get update && sudo apt-get install ffmpeg  # Linux
brew install ffmpeg  # macOS
```

### Video generation fails?
1. Check your API keys are correct
2. Verify internet connection
3. Check backend logs for specific errors
4. Try a shorter duration (30 seconds)
5. Ensure you have disk space (~500MB per video)

---

## 📊 API Documentation

Once backend is running, visit:
- **Interactive API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

---

## 💡 Tips for Best Results

1. **Be Specific with Topics**
   - ✅ Good: "How to make homemade pizza step by step"
   - ❌ Vague: "Pizza"

2. **Optimal Duration**
   - Start with 60 seconds for testing
   - 90-120 seconds for full videos

3. **Better Scripts**
   - The LLM creates better content with clear topics
   - Educational content works best

4. **Stock Footage**
   - Pexels has more content for common topics
   - Nature, business, technology have great coverage

---

## 🎬 Example Topics to Try

- "The Science of Sleep and Dreams"
- "How Photosynthesis Works"
- "Benefits of Morning Exercise"
- "Introduction to Cryptocurrency"
- "The History of the Internet"
- "Climate Change Solutions"
- "Mindfulness and Mental Health"

---

## 📁 Project Structure

```
/workspace/
├── backend/           # Python FastAPI server
│   ├── main.py       # API endpoints
│   ├── config.py     # Settings
│   └── ...           # Services
├── frontend/         # React app
│   ├── src/
│   │   └── App.jsx   # Main UI
│   └── ...
├── output_videos/    # Your generated videos
└── DETAILED_PLAN.md  # Full documentation
```

---

## 🆘 Need Help?

1. Check `DETAILED_PLAN.md` for comprehensive documentation
2. Review backend logs for error messages
3. Test API directly at `/docs` endpoint
4. Verify all dependencies are installed

---

## 🎉 You're Ready!

Start creating amazing faceless videos now. Perfect for:
- YouTube automation
- Social media content
- Educational videos
- Marketing content
- Personal projects

**Happy Video Creating! 🎬✨**
