import asyncio
import subprocess
import os
from typing import List, Dict


class VideoEditor:
    def __init__(self):
        self.temp_dir = "temp_video"
        self.output_dir = "output_videos"
        os.makedirs(self.temp_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)
    
    async def download_video(self, url: str, output_path: str) -> bool:
        """Download a video from URL using ffmpeg."""
        
        cmd = [
            "ffmpeg",
            "-y",  # Overwrite output file
            "-i", url,
            "-c", "copy",
            "-loglevel", "error",
            output_path
        ]
        
        try:
            result = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await result.communicate()
            return result.returncode == 0
        except Exception as e:
            print(f"Error downloading video: {str(e)}")
            return False
    
    async def create_scene_video(self, scene: Dict, scene_index: int) -> Dict:
        """Create a video clip for a single scene with voiceover."""
        
        video_path = scene.get("video_path")
        audio_path = scene.get("audio_path")
        audio_duration = scene.get("audio_duration", 5)
        
        if not video_path or not audio_path:
            return scene
        
        output_path = os.path.join(self.temp_dir, f"scene_{scene_index}_final.mp4")
        
        # Create video with proper duration matching audio
        # Loop or trim video to match audio duration
        cmd = [
            "ffmpeg",
            "-y",
            "-stream_loop", "-1",  # Loop input
            "-i", video_path,
            "-i", audio_path,
            "-c:v", "libx264",
            "-preset", "fast",
            "-t", str(audio_duration),  # Trim to audio duration
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            "-loglevel", "error",
            output_path
        ]
        
        try:
            result = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await result.communicate()
            
            if result.returncode == 0:
                scene["scene_video_path"] = output_path
            else:
                print(f"Failed to create scene video for scene {scene_index}")
                
        except Exception as e:
            print(f"Error creating scene video: {str(e)}")
        
        return scene
    
    async def concatenate_videos(self, video_paths: List[str], output_path: str) -> bool:
        """Concatenate multiple video files into one."""
        
        if not video_paths:
            return False
        
        # Create a text file with all video paths
        concat_file = os.path.join(self.temp_dir, "concat_list.txt")
        
        with open(concat_file, "w") as f:
            for path in video_paths:
                f.write(f"file '{path}'\n")
        
        cmd = [
            "ffmpeg",
            "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", concat_file,
            "-c", "copy",
            "-loglevel", "error",
            output_path
        ]
        
        try:
            result = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await result.communicate()
            return result.returncode == 0
        except Exception as e:
            print(f"Error concatenating videos: {str(e)}")
            return False
    
    async def add_background_music(self, video_path: str, output_path: str, volume: float = 0.1) -> bool:
        """Add background music to the video (optional enhancement)."""
        
        # For now, we'll skip background music to keep it simple
        # This can be added later as an enhancement
        return True
    
    async def cleanup_temp_files(self, temp_dir: str = None):
        """Clean up temporary files."""
        
        if temp_dir is None:
            temp_dir = self.temp_dir
        
        try:
            for filename in os.listdir(temp_dir):
                file_path = os.path.join(temp_dir, filename)
                if os.path.isfile(file_path):
                    os.remove(file_path)
        except Exception as e:
            print(f"Error cleaning up temp files: {str(e)}")
