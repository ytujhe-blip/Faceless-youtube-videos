import edge_tts
import asyncio
import os
from typing import List


class VoiceoverService:
    def __init__(self):
        self.output_dir = "temp_audio"
        os.makedirs(self.output_dir, exist_ok=True)
    
    async def generate_speech(self, text: str, output_path: str, voice: str = "en-US-JennyNeural") -> str:
        """Generate speech from text using Edge TTS (free Microsoft service)."""
        
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_path)
        
        return output_path
    
    async def generate_scene_voiceovers(self, scenes: List[dict], base_output_path: str = "temp_audio") -> List[dict]:
        """Generate voiceover files for all scenes."""
        
        os.makedirs(base_output_path, exist_ok=True)
        
        for i, scene in enumerate(scenes):
            narration = scene.get("narration", "")
            if not narration:
                continue
            
            output_path = os.path.join(base_output_path, f"scene_{i+1}.mp3")
            
            try:
                # Use a natural sounding voice
                voice = "en-US-JennyNeural"  # Female voice
                
                await self.generate_speech(
                    text=narration,
                    output_path=output_path,
                    voice=voice
                )
                
                scene["audio_path"] = output_path
                
                # Get audio duration using ffprobe
                scene["audio_duration"] = await self.get_audio_duration(output_path)
                
            except Exception as e:
                print(f"Error generating voiceover for scene {i+1}: {str(e)}")
                scene["audio_path"] = None
                scene["audio_duration"] = 0
        
        return scenes
    
    async def get_audio_duration(self, audio_path: str) -> float:
        """Get the duration of an audio file using ffprobe."""
        import subprocess
        
        cmd = [
            "ffprobe",
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            audio_path
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            return float(result.stdout.strip())
        except Exception as e:
            print(f"Error getting audio duration: {str(e)}")
            return 0
