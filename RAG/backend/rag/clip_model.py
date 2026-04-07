import torch
import open_clip
import numpy as np
from PIL import Image

model, _, preprocess = None, None, None
tokenizer = None

def load_model():
    global model, preprocess, tokenizer
    print("Loading CLIP model (ViT-L-14)...")
    model, _, preprocess = open_clip.create_model_and_transforms('ViT-L-14', pretrained='openai')
    tokenizer = open_clip.get_tokenizer('ViT-L-14')
    model.eval()
    print("CLIP model loaded.")

def encode_image(image_path_or_pil):
    if isinstance(image_path_or_pil, str):
        image = Image.open(image_path_or_pil).convert("RGB")
    else:
        image = image_path_or_pil.convert("RGB")
        
    image_tensor = preprocess(image).unsqueeze(0)
    with torch.no_grad():
        image_features = model.encode_image(image_tensor)
        
    embedding = image_features.cpu().numpy()[0]
    # Normalize embedding
    embedding = embedding / np.linalg.norm(embedding)
    return embedding

def encode_text(text):
    text_tokens = tokenizer(text)
    with torch.no_grad():
        text_features = model.encode_text(text_tokens)
        
    embedding = text_features.cpu().numpy()[0]
    # Normalize embedding
    embedding = embedding / np.linalg.norm(embedding)
    return embedding
