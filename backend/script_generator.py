from openai import OpenAI
from config import settings
import json


class ScriptGenerator:
    def __init__(self):
        self.client = OpenAI(
            api_key=settings.llm_api_key,
            base_url=settings.llm_base_url
        )
        self.model = settings.llm_model
    
    def generate_script(self, topic: str, duration_seconds: int = 60) -> dict:
        """Generate a video script with scenes based on the topic."""
        
        # Calculate approximate word count (average speaking rate: 150 words per minute)
        word_count = int((duration_seconds / 60) * 150)
        
        prompt = f"""Create a short video script about "{topic}". The video should be approximately {duration_seconds} seconds long.

Return ONLY a valid JSON object with this exact structure:
{{
    "title": "Video title",
    "description": "Brief description of the video",
    "scenes": [
        {{
            "scene_number": 1,
            "narration": "What the voiceover will say",
            "visual_description": "Description of what should be shown in this scene for stock footage search",
            "search_keywords": ["keyword1", "keyword2", "keyword3"],
            "duration_seconds": 5
        }}
    ],
    "total_duration_seconds": {duration_seconds}
}}

Requirements:
- Create 4-8 scenes depending on complexity
- Each scene should have clear visual descriptions for stock footage
- Include relevant search keywords for each scene
- Total duration should match the requested duration
- Make it engaging and informative
- Return ONLY the JSON, no additional text"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a professional video script writer. You always return valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content.strip()
            
            # Extract JSON from response (handle potential markdown code blocks)
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            content = content.strip()
            
            script_data = json.loads(content)
            
            # Validate structure
            if "scenes" not in script_data or not isinstance(script_data["scenes"], list):
                raise ValueError("Invalid script structure: missing scenes array")
            
            return script_data
            
        except Exception as e:
            raise Exception(f"Failed to generate script: {str(e)}")
