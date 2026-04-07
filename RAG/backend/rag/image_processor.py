import os
import base64
from .clip_model import encode_image
from .vector_store import add_to_index, save_index
from langchain_core.messages import HumanMessage
from langchain_ollama import ChatOllama

def process_image_file(file_path: str, filename: str):
    print(f"Processing image: {filename}")
    embedding = encode_image(file_path)
    
    description = f"[Uploaded Image Viewable by Agent: {filename}]"
    
    metadata = {
        "content": description,
        "type": "image",
        "source": filename,
        "path": file_path
    }
    
    add_to_index(embedding, metadata)
    save_index()
    print(f"Successfully processed image: {filename}")
