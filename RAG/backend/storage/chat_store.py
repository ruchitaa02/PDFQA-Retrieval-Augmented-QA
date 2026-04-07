import json
import os
import time
import uuid

CHATS_FILE = "storage/chats.json"

def _load_chats():
    if not os.path.exists(CHATS_FILE):
        return {}
    try:
        with open(CHATS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading chats: {e}")
        return {}

def _save_chats(chats):
    try:
        with open(CHATS_FILE, "w", encoding="utf-8") as f:
            json.dump(chats, f, indent=4)
    except Exception as e:
        print(f"Error saving chats: {e}")

def create_chat(title="New Chat"):
    chats = _load_chats()
    chat_id = str(uuid.uuid4())
    chats[chat_id] = {
        "id": chat_id,
        "title": title,
        "created_at": time.time(),
        "messages": []
    }
    _save_chats(chats)
    return chats[chat_id]

def get_chat(chat_id):
    chats = _load_chats()
    return chats.get(chat_id)

def get_all_chats():
    chats = _load_chats()
    # Return list of chats sorted by created_at desc
    chat_list = list(chats.values())
    chat_list.sort(key=lambda x: x["created_at"], reverse=True)
    return chat_list

def delete_chat(chat_id):
    chats = _load_chats()
    if chat_id in chats:
        del chats[chat_id]
        _save_chats(chats)
        return True
    return False

def update_chat_title(chat_id, new_title):
    chats = _load_chats()
    if chat_id in chats:
        chats[chat_id]["title"] = new_title
        _save_chats(chats)
        return True
    return False

def search_messages(query):
    chats = _load_chats()
    results = []
    for chat_id, chat in chats.items():
        for msg in chat["messages"]:
            if msg["role"] == "user" or msg["role"] == "assistant":
                if query.lower() in msg["content"].lower():
                     results.append({
                         "chat_id": chat_id,
                         "chat_title": chat["title"],
                         "timestamp": msg["timestamp"],
                         "role": msg["role"],
                         "content": msg["content"]
                     })
    # Sort by timestamp desc
    results.sort(key=lambda x: x["timestamp"], reverse=True)
    return results

def add_message(chat_id, role, content, sources=None, attachment=None):
    chats = _load_chats()
    if chat_id in chats:
        message = {
            "id": str(uuid.uuid4()),
            "role": role,
            "content": content,
            "timestamp": time.time()
        }
        if sources:
            message["sources"] = sources
        if attachment:
            message["attachment"] = attachment
            
        chats[chat_id]["messages"].append(message)
        
        # Don't update title here anymore, handled in API
             
        _save_chats(chats)
        return message
    return None
