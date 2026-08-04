from pydantic_settings import BaseSettings
from typing import Optional, List
import json
import os


class Settings(BaseSettings):
    llm_api_key: str = ""
    llm_base_url: str = "https://api.openai.com/v1"
    llm_model: str = "gpt-3.5-turbo"
    pexels_api_key: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Path to store user settings
SETTINGS_FILE = "user_settings.json"


def load_user_settings() -> dict:
    """Load user settings from JSON file."""
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading settings: {e}")
    
    # Default settings
    return {
        "llm_api_key": "",
        "llm_base_url": "https://api.openai.com/v1",
        "llm_model": "gpt-3.5-turbo",
        "pexels_api_key": "",
        "voice_provider": "edge_tts",  # edge_tts, openai_tts
        "openai_tts_voice": "alloy",
        "video_quality": "720p",
        "default_duration": 60,
        "add_text_overlays": True,
        "add_transitions": True,
        "add_background_music": False
    }


def save_user_settings(settings_data: dict) -> bool:
    """Save user settings to JSON file."""
    try:
        with open(SETTINGS_FILE, "w") as f:
            json.dump(settings_data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving settings: {e}")
        return False


def get_effective_settings() -> dict:
    """Get effective settings combining env vars and user settings."""
    user_settings = load_user_settings()
    
    # User settings take precedence over env vars
    return {
        "llm_api_key": user_settings.get("llm_api_key") or os.getenv("LLM_API_KEY", ""),
        "llm_base_url": user_settings.get("llm_base_url") or os.getenv("LLM_BASE_URL", "https://api.openai.com/v1"),
        "llm_model": user_settings.get("llm_model") or os.getenv("LLM_MODEL", "gpt-3.5-turbo"),
        "pexels_api_key": user_settings.get("pexels_api_key") or os.getenv("PEXELS_API_KEY", ""),
        "voice_provider": user_settings.get("voice_provider", "edge_tts"),
        "openai_tts_voice": user_settings.get("openai_tts_voice", "alloy"),
        "video_quality": user_settings.get("video_quality", "720p"),
        "default_duration": user_settings.get("default_duration", 60),
        "add_text_overlays": user_settings.get("add_text_overlays", True),
        "add_transitions": user_settings.get("add_transitions", True),
        "add_background_music": user_settings.get("add_background_music", False)
    }


settings = Settings()
