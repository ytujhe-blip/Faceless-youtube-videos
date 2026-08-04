import requests
from typing import List, Dict
from config import settings


class PexelsService:
    def __init__(self):
        self.api_key = settings.pexels_api_key
        self.base_url = "https://api.pexels.com/videos"
        self.headers = {
            "Authorization": self.api_key
        }
    
    def search_videos(self, query: str, per_page: int = 5, orientation: str = "landscape") -> List[Dict]:
        """Search for stock videos on Pexels."""
        
        params = {
            "query": query,
            "per_page": per_page,
            "orientation": orientation,
            "size": "medium"
        }
        
        try:
            response = requests.get(
                self.base_url,
                headers=self.headers,
                params=params,
                timeout=10
            )
            response.raise_for_status()
            
            data = response.json()
            videos = []
            
            for video in data.get("videos", []):
                video_files = video.get("video_files", [])
                
                # Find the best quality video file (prefer 720p or 1080p)
                video_url = None
                for file in video_files:
                    if file.get("quality") == "hd":
                        video_url = file.get("link")
                        break
                
                if not video_url and video_files:
                    # Fallback to first available file
                    video_url = video_files[0].get("link")
                
                if video_url:
                    videos.append({
                        "id": video.get("id"),
                        "url": video_url,
                        "duration": video.get("duration", 15),
                        "width": video.get("width", 1920),
                        "height": video.get("height", 1080),
                        "thumbnail": video.get("image"),
                        "user": video.get("user", {}).get("name", "Unknown")
                    })
            
            return videos
            
        except requests.exceptions.RequestException as e:
            print(f"Pexels API error: {str(e)}")
            return []
    
    def find_video_for_scene(self, keywords: List[str], orientation: str = "landscape") -> Dict:
        """Find the best matching video for a scene based on keywords."""
        
        # Try each keyword until we find a video
        for keyword in keywords:
            videos = self.search_videos(keyword, per_page=3, orientation=orientation)
            if videos:
                return videos[0]  # Return the first/best match
        
        # If no video found with keywords, try a generic search
        videos = self.search_videos("background abstract", per_page=3, orientation=orientation)
        return videos[0] if videos else None
