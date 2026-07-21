import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

# Use AsyncOpenAI client for non-blocking asynchronous operations
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def generate_audio(text: str):
    """
    Generate audio from text using OpenAI's TTS API.
    Uses the 'alloy' voice by default, or 'shimmer' if requested.
    """
    try:
        # OpenAI TTS model (tts-1 is faster, tts-1-hd is higher quality)
        # Voices: alloy, echo, fable, onyx, nova, and shimmer
        response = await client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=text
        )
        
        # Return the binary content directly
        return response.content

    except Exception as e:
        print(f"Error generating audio with OpenAI: {e}")
        return None