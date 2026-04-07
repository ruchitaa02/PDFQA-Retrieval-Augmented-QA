from fastapi import APIRouter, UploadFile, File, HTTPException
import os
import shutil
from rag.pdf_processor import process_pdf_file
from rag.image_processor import process_image_file

router = APIRouter()

UPLOAD_DIR = "storage/documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs("storage/images", exist_ok=True)

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
        
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        filename_lower = file.filename.lower()
        
        if filename_lower.endswith(".pdf"):
            process_pdf_file(file_path, file.filename)
            return {"message": f"Successfully processed PDF: {file.filename}"}
            
        elif filename_lower.endswith((".png", ".jpg", ".jpeg")):
            # Process with CLIP image encoder and Ollama Vision model
            try:
                process_image_file(file_path, file.filename)
            except Exception as e:
                print(f"Image processing error: {e}")
                
            return {"message": f"Successfully processed image: {file.filename}"}
            
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
