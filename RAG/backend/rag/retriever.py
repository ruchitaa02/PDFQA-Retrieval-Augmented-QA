from .clip_model import encode_text
from .vector_store import search_index

def retrieve(query: str, top_k: int = 5):
    print(f"Retrieving context for query: {query}")
    query_embedding = encode_text(query)
    results = search_index(query_embedding, top_k=top_k)
    return results
