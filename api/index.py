from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import time
from dotenv import load_dotenv
import google.generativeai as genai
import random
from .knowledge_base import KNOWLEDGE_BASE

# Load environment variables
load_dotenv()

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        ]
        llm_model = genai.GenerativeModel(
            model_name='gemini-flash-latest',
            safety_settings=safety_settings
        )
    except Exception:
        llm_model = None
else:
    llm_model = None

app = FastAPI()

class ChatRequest(BaseModel):
    message: str
    context: list[str] = []

class ChatResponse(BaseModel):
    response: str
    processed_at: float
    model_used: str

def get_smart_fallback(user_msg: str) -> str:
    user_msg = user_msg.lower()
    best_match = None
    max_matches = 0
    for category, data in KNOWLEDGE_BASE.items():
        match_count = sum(1 for kw in data["keywords"] if kw in user_msg)
        if match_count > max_matches:
            max_matches = match_count
            best_match = category
    if best_match:
        return random.choice(KNOWLEDGE_BASE[best_match]["responses"])
    return f"Aww, aku dengar kamu bilang '{user_msg}'. Sebagai LoveBot, aku melihat ini sebagai warna-warni dalam hubungan. Ceritain lebih lanjut dong!"

@app.get("/api")
async def root():
    return {
        "status": "LoveChat AI Backend is active",
        "llm_active": llm_model is not None,
        "version": "2.2.0-VERCEL"
    }

@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    try:
        user_msg = request.message
        
        if llm_model:
            system_prompt = """
            Identity: Kamu adalah LoveBot 2.0, asisten AI tercerdas dan paling romantis di aplikasi LoveChat.
            Style: Gunakan Bahasa Indonesia yang sangat ramah, hangat, perhatian, dan sedikit jenaka (Gaya bahasa anak muda Jakarta/gaul tapi sopan).
            Objective: Bantu user dengan masalah hubungan, beri saran romantis, atau ngobrol santai layaknya sahabat karib. 
            Constraint: Jangan memberikan jawaban yang terlalu teknis/kaku. Selalu akhiri dengan emoji yang manis. Maksimal 3-4 kalimat.
            """
            ctx_list = list(request.context)
            chat_context = "\n".join(ctx_list[-5:]) if ctx_list else ""
            full_prompt = f"{system_prompt}\n\nContext Percakapan:\n{chat_context}\n\nUser: {user_msg}\nLoveBot:"
            
            response = llm_model.generate_content(full_prompt)
            return ChatResponse(
                response=str(response.text).strip(),
                processed_at=float(time.time()),
                model_used="Gemini 1.5 Flash (Vercel AI)"
            )
            
        bot_reply = get_smart_fallback(user_msg)
        return ChatResponse(
            response=bot_reply,
            processed_at=time.time(),
            model_used="LoveBot Knowledge Base"
        )
    except Exception as e:
        return ChatResponse(
            response="Duh, otak AI aku lagi overheat sedikit. Tapi intinya aku selalu di sini buat kamu! ❤️",
            processed_at=time.time(),
            model_used="Error Fallback"
        )
