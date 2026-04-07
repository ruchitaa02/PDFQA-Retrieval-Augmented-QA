import os
import fitz  # PyMuPDF
from PIL import Image
import io
from .clip_model import encode_text, encode_image
from .vector_store import add_to_index, save_index

def process_pdf_file(file_path: str, filename: str):
    print(f"Processing PDF: {filename}")
    doc = fitz.open(file_path)
    
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text()
        if text.strip():
            embedding = encode_text(text)
            metadata = {
                "content": text.strip()[:1000],
                "type": "text",
                "source": filename,
                "page": page_num + 1
            }
            add_to_index(embedding, metadata)
            
        image_list = page.get_images()
        for img_index, img in enumerate(image_list):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            
            img_filename = f"{filename}_p{page_num+1}_img{img_index}.png"
            img_path = os.path.join("storage/images", img_filename)
            
            with open(img_path, "wb") as f:
                f.write(image_bytes)
                
            embedding = encode_image(img_path)
            metadata = {
                "content": f"Image extracted from page {page_num+1}",
                "type": "image",
                "source": filename,
                "path": img_path,
                "page": page_num + 1
            }
            add_to_index(embedding, metadata)
            
    save_index()
    print(f"Successfully processed PDF: {filename}")
