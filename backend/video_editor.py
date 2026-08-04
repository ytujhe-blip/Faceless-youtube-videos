import asyncio
import subprocess
import os
from typing import List, Dict, Optional
import json


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
    
    async def create_scene_video(self, scene: Dict, scene_index: int, 
                                  quality: str = "720p", add_text: bool = True) -> Dict:
        """Create a video clip for a single scene with voiceover and text overlay."""
        
        video_path = scene.get("video_path")
        audio_path = scene.get("audio_path")
        audio_duration = scene.get("audio_duration", 5)
        text_overlay = scene.get("text", "") if add_text else ""
        
        if not video_path or not audio_path:
            return scene
        
        output_path = os.path.join(self.temp_dir, f"scene_{scene_index}_final.mp4")
        
        # Resolution settings
        resolution_map = {
            "480p": "854x480",
            "720p": "1280x720",
            "1080p": "1920x1080"
        }
        resolution = resolution_map.get(quality, "1280x720")
        
        # Build ffmpeg command with text overlay if text exists
        filter_complex = []
        input_args = ["-stream_loop", "-1", "-i", video_path, "-i", audio_path]
        
        if text_overlay and add_text:
            # Escape special characters for ffmpeg
            escaped_text = text_overlay.replace("'", "").replace(":", "\\:").replace(",", "\\,")
            # Text overlay filter with styling
            text_filter = (
                f"[0:v]scale={resolution},"
                f"drawtext=text='{escaped_text}':fontsize=36:fontcolor=white:"
                f"borderw=2:bordercolor=black:box=1:boxcolor=black@0.5:"
                f"x=(w-text_w)/2:y=h-th-50[v]"
            )
            filter_complex.append(text_filter)
            output_args = ["-map", "[v]", "-map", "1:a"]
        else:
            # Just scale video without text
            filter_complex.append(f"[0:v]scale={resolution}[v]")
            output_args = ["-map", "[v]", "-map", "1:a"]
        
        cmd = [
            "ffmpeg",
            "-y",
            *input_args,
            "-filter_complex", ";".join(filter_complex),
            *output_args,
            "-c:v", "libx264",
            "-preset", "fast",
            "-t", str(audio_duration),
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
    
    async def concatenate_videos(self, video_paths: List[str], output_path: str, 
                                  add_transitions: bool = True) -> bool:
        """Concatenate multiple video files into one with optional crossfade transitions."""
        
        if not video_paths:
            return False
        
        if len(video_paths) == 1:
            # Just copy if only one video
            cmd = ["cp", video_paths[0], output_path]
            try:
                result = await asyncio.create_subprocess_exec(*cmd)
                await result.communicate()
                return result.returncode == 0
            except:
                pass
            # Fallback to ffmpeg
            cmd = ["ffmpeg", "-y", "-i", video_paths[0], "-c", "copy", output_path]
        
        if add_transitions and len(video_paths) > 1:
            # Use crossfade transitions between videos
            return await self._concatenate_with_transitions(video_paths, output_path)
        else:
            # Simple concatenation without transitions
            return await self._concatenate_simple(video_paths, output_path)
    
    async def _concatenate_simple(self, video_paths: List[str], output_path: str) -> bool:
        """Simple concatenation without transitions."""
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
    
    async def _concatenate_with_transitions(self, video_paths: List[str], output_path: str) -> bool:
        """Concatenate videos with crossfade transitions."""
        transition_duration = 0.5  # seconds
        
        if len(video_paths) < 2:
            return False
        
        # Build complex filter for crossfade transitions
        inputs = []
        for path in video_paths:
            inputs.extend(["-i", path])
        
        # Generate filter complex for crossfade
        filter_parts = []
        last_output = "[0:v]"
        
        for i in range(len(video_paths) - 1):
            duration_offset = sum([await self._get_video_duration(video_paths[j]) for j in range(i+1)])
            fade_time = duration_offset - transition_duration
            
            if i == 0:
                filter_parts.append(
                    f"[0:v][1:v]xfade=transition=fade:duration={transition_duration}:offset={fade_time}[v{i}]"
                )
                last_output = f"[v{i}]"
            else:
                next_input_idx = i + 1
                filter_parts.append(
                    f"{last_output}[{next_input_idx}:v]xfade=transition=fade:duration={transition_duration}:offset={fade_time}[v{i}]"
                )
                last_output = f"[v{i}]"
        
        # Add audio concatenation
        audio_inputs = " ".join([f"[{i}:a]" for i in range(len(video_paths))])
        filter_parts.append(f"{audio_inputs}concat=n={len(video_paths)}:v=0:a=1[a]")
        
        filter_complex = ";".join(filter_parts)
        
        cmd = [
            "ffmpeg",
            "-y",
            *inputs,
            "-filter_complex", filter_complex,
            "-map", last_output,
            "-map", "[a]",
            "-c:v", "libx264",
            "-preset", "fast",
            "-c:a", "aac",
            "-b:a", "192k",
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
            print(f"Error with transitions: {str(e)}, falling back to simple concat")
            return await self._concatenate_simple(video_paths, output_path)
    
    async def _get_video_duration(self, video_path: str) -> float:
        """Get duration of a video file."""
        cmd = [
            "ffprobe",
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            video_path
        ]
        
        try:
            result = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await result.communicate()
            return float(stdout.decode().strip())
        except:
            return 5.0  # Default fallback
    
    async def add_background_music(self, video_path: str, output_path: str, 
                                    music_path: Optional[str] = None, 
                                    volume: float = 0.15) -> bool:
        """Add background music to the video."""
        
        if not music_path or not os.path.exists(music_path):
            # Try to use a default royalty-free music file if available
            default_music = os.path.join("assets", "background_music.mp3")
            if os.path.exists(default_music):
                music_path = default_music
            else:
                return True  # Skip if no music available
        
        cmd = [
            "ffmpeg",
            "-y",
            "-i", video_path,
            "-i", music_path,
            "-filter_complex",
            f"[1:a]volume={volume},aloop=loop=-1:size=2e+09[music];[0:a][music]amix=inputs=2:duration=first:dropout_transition=3[a]",
            "-map", "0:v",
            "-map", "[a]",
            "-c:v", "copy",
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
                # Replace original with music version
                os.replace(output_path + ".tmp", output_path) if os.path.exists(output_path + ".tmp") else None
                return True
            return False
        except Exception as e:
            print(f"Error adding background music: {str(e)}")
            return False
    
    async def generate_preview(self, video_path: str, preview_path: str, 
                                duration: int = 5) -> bool:
        """Generate a short preview GIF or low-res video."""
        
        cmd = [
            "ffmpeg",
            "-y",
            "-i", video_path,
            "-t", str(duration),
            "-vf", "fps=10,scale=480:-1:flags=lanczos",
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-crf", "28",
            "-loglevel", "error",
            preview_path
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
            print(f"Error generating preview: {str(e)}")
            return False
    
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
