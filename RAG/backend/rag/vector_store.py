import faiss
import numpy as np
import os
import json

DIMENSION = 768
INDEX_PATH = "storage/vectors.index"
METADATA_PATH = "storage/metadata.json"

index = None
metadata = {}

def load_or_create_index():
    global index, metadata
    
    if os.path.exists(INDEX_PATH):
        print(f"Loading FAISS index from {INDEX_PATH}")
        index = faiss.read_index(INDEX_PATH)
    else:
        print("Creating new FAISS IndexFlatIP...")
        index = faiss.IndexFlatIP(DIMENSION)
        
    if os.path.exists(METADATA_PATH):
        try:
            with open(METADATA_PATH, "r") as f:
                metadata = json.load(f)
        except json.JSONDecodeError:
            metadata = {}
            
    print(f"Loaded {index.ntotal} vectors in index.")

def add_to_index(embedding, doc_metadata: dict):
    global index, metadata
    
    if index is None:
        load_or_create_index()
        
    embedding_np = np.array([embedding], dtype=np.float32)
    
    current_id = str(index.ntotal)
    metadata[current_id] = doc_metadata
    
    index.add(embedding_np)
    
def save_index():
    if index is not None:
        faiss.write_index(index, INDEX_PATH)
        with open(METADATA_PATH, "w") as f:
            json.dump(metadata, f, indent=4)
        print("Index and metadata saved locally.")

def search_index(query_embedding, top_k=5):
    if index is None or index.ntotal == 0:
        return []
        
    query_np = np.array([query_embedding], dtype=np.float32)
    distances, indices = index.search(query_np, top_k)
    
    results = []
    for i in range(len(indices[0])):
        idx = str(indices[0][i])
        if idx in metadata and idx != "-1":
            results.append({
                "score": float(distances[0][i]),
                "metadata": metadata[idx]
            })
            
    return results
