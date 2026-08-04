from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, Dict
import asyncio
import os
import uuid
import json

from config import settings
from script_generator import ScriptGenerator
from pexels_service import PexelsService
from voiceover_service import VoiceoverService
from video_editor import VideoEditor

app = FastAPI(title="Faceless Video Generator API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create necessary directories
os.makedirs("temp_audio", exist_ok=True)
os.makedirs("temp_video", exist_ok=True)
os.makedirs("output_videos", exist_ok=True)
os.makedirs("jobs", exist_ok=True)

# Mount static files for video downloads
app.mount("/videos", StaticFiles(directory="output_videos"), name="videos")


class GenerateRequest(BaseModel):
    topic: str
    duration_seconds: int = 60
    video_quality: str = "720p"  # 480p, 720p, 1080p
    add_text_overlays: bool = True
    add_transitions: bool = True
    add_background_music: bool = False


class JobStatus(BaseModel):
    job_id: str
    status: str  # pending, processing, completed, failed
    progress: int  # 0-100
    message: str
    video_url: Optional[str] = None
    error: Optional[str] = None


# Store job information in memory (use Redis/DB in production)
jobs = {}


async def process_video_generation(job_id: str, request: GenerateRequest):
    """Background task to generate video."""
    
    try:
        jobs[job_id]["status"] = "processing"
        jobs[job_id]["progress"] = 10
        
        # Step 1: Generate script using LLM
        print(f"[{job_id}] Generating script...")
        jobs[job_id]["message"] = "Generating script with AI..."
        
        script_gen = ScriptGenerator()
        script_data = script_gen.generate_script(
            topic=request.topic,
            duration_seconds=request.duration_seconds
        )
        
        jobs[job_id]["script"] = script_data
        jobs[job_id]["progress"] = 25
        jobs[job_id]["message"] = f"Script generated: {len(script_data['scenes'])} scenes"
        
        # Save script to file
        with open(os.path.join("jobs", f"{job_id}_script.json"), "w") as f:
            json.dump(script_data, f, indent=2)
        
        # Step 2: Find stock videos for each scene
        print(f"[{job_id}] Finding stock footage...")
        jobs[job_id]["message"] = "Searching for stock footage on Pexels..."
        
        pexels = PexelsService()
        
        for i, scene in enumerate(script_data["scenes"]):
            keywords = scene.get("search_keywords", [request.topic])
            video_info = pexels.find_video_for_scene(keywords)
            
            if video_info:
                scene["video_info"] = video_info
                
                # Download the video
                video_path = os.path.join("temp_video", f"scene_{i+1}_raw.mp4")
                downloaded = await VideoEditor().download_video(video_info["url"], video_path)
                
                if downloaded:
                    scene["video_path"] = video_path
            
            jobs[job_id]["progress"] = 25 + int((i + 1) / len(script_data["scenes"]) * 25)
        
        jobs[job_id]["message"] = "Stock footage downloaded"
        
        # Step 3: Generate voiceovers
        print(f"[{job_id}] Generating voiceovers...")
        jobs[job_id]["message"] = "Creating voiceover narration..."
        
        voiceover_service = VoiceoverService()
        audio_dir = os.path.join("temp_audio", job_id)
        
        scenes_with_audio = await voiceover_service.generate_scene_voiceovers(
            script_data["scenes"],
            audio_dir
        )
        
        jobs[job_id]["progress"] = 60
        jobs[job_id]["message"] = "Voiceovers generated"
        
        # Step 4: Create scene videos with text overlays and quality settings
        print(f"[{job_id}] Creating scene videos...")
        jobs[job_id]["message"] = "Assembling scene clips..."
        
        video_editor = VideoEditor()
        scene_video_paths = []
        
        for i, scene in enumerate(scenes_with_audio):
            if scene.get("video_path") and scene.get("audio_path"):
                updated_scene = await video_editor.create_scene_video(
                    scene, 
                    i + 1,
                    quality=request.video_quality,
                    add_text=request.add_text_overlays
                )
                if updated_scene.get("scene_video_path"):
                    scene_video_paths.append(updated_scene["scene_video_path"])
            
            jobs[job_id]["progress"] = 60 + int((i + 1) / len(scenes_with_audio) * 20)
        
        jobs[job_id]["message"] = f"Created {len(scene_video_paths)} scene clips"
        
        # Step 5: Concatenate all scenes with transitions
        print(f"[{job_id}] Concatenating videos...")
        jobs[job_id]["message"] = "Combining all scenes..."
        
        output_filename = f"{job_id}.mp4"
        output_path = os.path.join("output_videos", output_filename)
        
        success = await video_editor.concatenate_videos(
            scene_video_paths, 
            output_path,
            add_transitions=request.add_transitions
        )
        
        if not success:
            raise Exception("Failed to concatenate videos")
        
        jobs[job_id]["progress"] = 90
        jobs[job_id]["message"] = "Finalizing video..."
        
        # Clean up temp files (optional - keep for debugging)
        # await video_editor.cleanup_temp_files()
        
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["progress"] = 100
        jobs[job_id]["message"] = "Video generation complete!"
        jobs[job_id]["video_url"] = f"/videos/{output_filename}"
        jobs[job_id]["output_path"] = output_path
        
        print(f"[{job_id}] Video generation completed successfully!")
        
    except Exception as e:
        print(f"[{job_id}] Error: {str(e)}")
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)
        jobs[job_id]["message"] = f"Failed: {str(e)}"


@app.post("/api/generate")
async def generate_video(request: GenerateRequest, background_tasks: BackgroundTasks):
    """Start video generation process."""
    
    job_id = str(uuid.uuid4())
    
    jobs[job_id] = {
        "job_id": job_id,
        "status": "pending",
        "progress": 0,
        "message": "Initializing...",
        "request": request.dict(),
        "created_at": asyncio.get_event_loop().time()
    }
    
    # Start background task
    background_tasks.add_task(process_video_generation, job_id, request)
    
    return {"job_id": job_id, "status": "pending"}


@app.get("/api/status/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    """Get the status of a video generation job."""
    
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job_data = jobs[job_id]
    
    return JobStatus(
        job_id=job_id,
        status=job_data.get("status", "unknown"),
        progress=job_data.get("progress", 0),
        message=job_data.get("message", ""),
        video_url=job_data.get("video_url"),
        error=job_data.get("error")
    )


@app.get("/api/video/{job_id}")
async def download_video(job_id: str):
    """Download the generated video."""
    
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job_data = jobs[job_id]
    
    if job_data.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Video not ready yet")
    
    video_path = job_data.get("output_path")
    
    if not video_path or not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video file not found")
    
    return FileResponse(
        path=video_path,
        media_type="video/mp4",
        filename=f"video_{job_id}.mp4"
    )


@app.get("/api/jobs")
async def list_jobs():
    """List all jobs (for debugging/admin)."""
    
    return {
        "jobs": [
            {
                "job_id": job_id,
                "status": data.get("status"),
                "progress": data.get("progress"),
                "topic": data.get("request", {}).get("topic"),
                "created_at": data.get("created_at"),
                "video_quality": data.get("request", {}).get("video_quality")
            }
            for job_id, data in sorted(jobs.items(), key=lambda x: x[1].get("created_at", ""), reverse=True)
        ]
    }


@app.get("/api/job/{job_id}/details")
async def get_job_details(job_id: str):
    """Get detailed information about a specific job including script and metadata."""
    
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job_data = jobs[job_id]
    
    # Load script if available
    script_path = os.path.join("jobs", f"{job_id}_script.json")
    script = None
    if os.path.exists(script_path):
        with open(script_path, "r") as f:
            script = json.load(f)
    
    return {
        "job_id": job_id,
        "status": job_data.get("status"),
        "progress": job_data.get("progress"),
        "message": job_data.get("message"),
        "video_url": job_data.get("video_url"),
        "error": job_data.get("error"),
        "request": job_data.get("request"),
        "script": script,
        "created_at": job_data.get("created_at")
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Faceless Video Generator API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
