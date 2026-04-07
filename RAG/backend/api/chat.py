from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from storage.chat_store import create_chat, get_chat, get_all_chats, delete_chat, add_message, update_chat_title
from rag.agent import run_agent, generate_chat_title
import base64
import os
import asyncio

router = APIRouter()

class ChatCreateRequest(BaseModel):
    title: Optional[str] = "New Chat"

class ChatResponse(BaseModel):
    id: str
    title: str
    created_at: float
    messages: List[dict]

class ChatListResponse(BaseModel):
    chats: List[dict]

class MessageRequest(BaseModel):
    content: str
    attachment: Optional[str] = None

class MessageResponse(BaseModel):
    role: str
    content: str
    sources: Optional[List[dict]] = None
    chat_id: str

@router.post("/chats", response_model=ChatResponse)
async def create_new_chat(request: ChatCreateRequest):
    chat = create_chat(request.title)
    return chat

@router.get("/chats", response_model=ChatListResponse)
async def list_chats():
    chats = get_all_chats()
    # Filter out empty chats (created but no messages)
    non_empty_chats = [c for c in chats if len(c.get("messages", [])) > 0]
    return {"chats": non_empty_chats}

@router.get("/chats/{chat_id}", response_model=ChatResponse)
async def get_chat_details(chat_id: str):
    chat = get_chat(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat

@router.delete("/chats/{chat_id}")
async def delete_chat_endpoint(chat_id: str):
    success = delete_chat(chat_id)
    if not success:
        raise HTTPException(status_code=404, detail="Chat not found")
    return {"message": "Chat deleted successfully"}

@router.post("/chats/{chat_id}/message", response_model=MessageResponse)
async def send_message(chat_id: str, request: MessageRequest):
    # 1. Get Chat to verify existence
    chat = get_chat(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    # 2. Add User Message
    add_message(chat_id, "user", request.content, attachment=request.attachment)
    
    # 2.5 Generate Title if first message
    updated_chat_check = get_chat(chat_id)
    if updated_chat_check["title"] == "New Chat":
        try:
             new_title = generate_chat_title(request.content)
             update_chat_title(chat_id, new_title)
        except Exception as e:
             print(f"Failed to update title: {e}")

    # 3. Run Agent (Handles retrieval and generation)
    
    # Prepare images if any attached
    retrieved_images = [] # Base64 strings
    attachment_name = None
    
    if request.attachment:
        attachment_name = request.attachment
        attachment_path = os.path.join("storage/documents", request.attachment)
        if os.path.exists(attachment_path) and request.attachment.lower().endswith(('.png', '.jpg', '.jpeg')):
            try:
                with open(attachment_path, "rb") as img_file:
                    encoded_string = base64.b64encode(img_file.read()).decode('utf-8')
                    retrieved_images.append(encoded_string)
            except Exception as e:
                print(f"Error reading attached image {attachment_path}: {e}")

    # Get history for context
    full_history = updated_chat_check["messages"]
    # Exclude the last message (current user query) because run_agent takes query argument
    history_for_llm = full_history[:-1]
    
    formatted_history = []
    for msg in history_for_llm:
        formatted_history.append({"role": msg["role"], "content": msg["content"]})

    try:
        answer, sources = run_agent(
            query=request.content,
            history=formatted_history,
            images=retrieved_images,
            attachment_name=attachment_name
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")
    
    # 4. Add Assistant Message
    add_message(chat_id, "assistant", answer, sources)
    
    return {
        "role": "assistant",
        "content": answer,
        "sources": sources,
        "chat_id": chat_id
    }
