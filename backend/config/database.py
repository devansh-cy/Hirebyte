import os
from dotenv import load_dotenv
try:
    from supabase import create_client, Client
    HAS_SUPABASE_LIB = True
except ImportError:
    HAS_SUPABASE_LIB = False
    Client = object # Dummy for type hint

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = None

if not HAS_SUPABASE_LIB:
    print("[WARN] 'supabase' library not installed. Database functionalites will be disabled.")
elif not SUPABASE_URL or not SUPABASE_KEY:
    print("[WARN] SUPABASE_URL or SUPABASE_KEY is missing in backend/.env")
else:
    # Initialize Supabase client
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("[OK] Supabase client initialized")
    except Exception as e:
        print(f"[ERROR] Failed to initialize Supabase client: {e}")
        supabase = None

async def init_db():
    """Check Supabase connection"""
    if supabase:
        print("[OK] Supabase ready")
    else:
        print("[ERR] Supabase not initialized")

async def close_db():
    """No-op for Supabase REST client"""
    pass