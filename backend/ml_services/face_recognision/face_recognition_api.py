# facial_recognition_api.py
import cv2
import numpy as np
from pymongo import MongoClient
from datetime import datetime
from deepface import DeepFace
from dotenv import load_dotenv
import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import base64
import io
from PIL import Image

load_dotenv()

app = FastAPI(title="Face Recognition API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FaceRecognitionSystem:
    def __init__(self, mongodb_uri=os.getenv("MONGO_URI"), db_name="face_recognition"):
        """Initialize the face recognition system with MongoDB connection"""
        self.client = MongoClient(mongodb_uri)
        self.db = self.client[db_name]
        self.faces_collection = self.db['faces']
        self.logs_collection = self.db['recognition_logs']
        self.model_name = "Facenet"
        
    def _cosine_distance(self, vec1, vec2):
        """Calculate cosine distance between two vectors"""
        vec1 = np.array(vec1)
        vec2 = np.array(vec2)
        return 1 - np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))
    
    def register_face(self, name, image_array):
        """Register a new face in the database"""
        try:
            # Convert numpy array to temporary image file
            temp_path = f"temp_register_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
            cv2.imwrite(temp_path, image_array)
            
            # Extract face embedding using DeepFace
            embedding_objs = DeepFace.represent(
                img_path=temp_path,
                model_name=self.model_name,
                enforce_detection=True
            )
            
            if len(embedding_objs) == 0:
                os.remove(temp_path)
                return {"success": False, "error": "No face detected in the image"}
            
            if len(embedding_objs) > 1:
                os.remove(temp_path)
                return {"success": False, "error": "Multiple faces detected. Please provide an image with only one face"}
            
            embedding = embedding_objs[0]['embedding']
            
            # Store in MongoDB
            face_data = {
                'name': name,
                'embedding': embedding,
                'model': self.model_name,
                'registered_at': datetime.now(),
                'updated_at': datetime.now()
            }
            
            # Check if person already exists
            existing = self.faces_collection.find_one({'name': name})
            if existing:
                self.faces_collection.update_one(
                    {'name': name},
                    {'$set': {'embedding': embedding, 'updated_at': datetime.now()}}
                )
                message = f"Updated face embedding for {name}"
            else:
                self.faces_collection.insert_one(face_data)
                message = f"Registered new face for {name}"
            
            # Clean up temp file
            os.remove(temp_path)
            
            return {"success": True, "message": message}
            
        except Exception as e:
            # Clean up temp file if it exists
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return {"success": False, "error": str(e)}
    
    def recognize_face(self, image_array, threshold=0.4):
        """Recognize faces in an image"""
        try:
            # Convert numpy array to temporary image file
            temp_path = f"temp_recognize_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
            cv2.imwrite(temp_path, image_array)
            
            # Extract embeddings from the image
            embedding_objs = DeepFace.represent(
                img_path=temp_path,
                model_name=self.model_name,
                enforce_detection=False
            )
            
            # Load all known faces from MongoDB
            known_faces = list(self.faces_collection.find())
            
            recognized_faces = []
            
            for obj in embedding_objs:
                embedding = obj['embedding']
                facial_area = obj['facial_area']
                
                best_match = None
                best_distance = float('inf')
                
                # Compare with all known faces
                for known_face in known_faces:
                    distance = self._cosine_distance(embedding, known_face['embedding'])
                    
                    if distance < best_distance and distance < threshold:
                        best_distance = distance
                        best_match = known_face['name']
                
                name = best_match if best_match else "Unknown"
                confidence = 1 - best_distance if best_match else 0
                
                result = {
                    'name': name,
                    'confidence': float(confidence),
                    'location': facial_area,
                    'success': True
                }
                
                recognized_faces.append(result)
                
                # Log recognition
                self.logs_collection.insert_one({
                    'name': name,
                    'confidence': float(confidence),
                    'timestamp': datetime.now(),
                    'location': facial_area
                })
            
            # Clean up temp file
            os.remove(temp_path)
            
            return {"success": True, "recognized_faces": recognized_faces}
            
        except Exception as e:
            # Clean up temp file if it exists
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return {"success": False, "error": str(e)}
    
    def list_registered_faces(self):
        """List all registered faces"""
        faces = list(self.faces_collection.find({}, {'name': 1, 'registered_at': 1, '_id': 0}))
        return {"success": True, "faces": faces}
    
    def delete_face(self, name):
        """Delete a registered face"""
        result = self.faces_collection.delete_one({'name': name})
        if result.deleted_count > 0:
            return {"success": True, "message": f"Deleted face for {name}"}
        else:
            return {"success": False, "error": f"No face found for {name}"}

# Initialize the face recognition system
fr_system = FaceRecognitionSystem()

# Utility functions
def base64_to_image(base64_string):
    """Convert base64 string to OpenCV image"""
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        image_data = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_data))
        return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")

# API Routes
@app.get("/")
async def root():
    return {"message": "Face Recognition API is running"}

@app.post("/register")
async def register_face(name: str = Form(...), image: UploadFile = File(...)):
    """Register a new face"""
    try:
        # Read image file
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        result = fr_system.register_face(name, img)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return JSONResponse(content=result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/register-base64")
async def register_face_base64(name: str, image_data: str):
    """Register face using base64 image data"""
    try:
        img = base64_to_image(image_data)
        result = fr_system.register_face(name, img)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return JSONResponse(content=result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recognize")
async def recognize_face(image: UploadFile = File(...), threshold: float = 0.4):
    """Recognize faces in an image"""
    try:
        # Read image file
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        result = fr_system.recognize_face(img, threshold)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return JSONResponse(content=result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recognize-base64")
async def recognize_face_base64(image_data: str, threshold: float = 0.4):
    """Recognize faces using base64 image data"""
    try:
        img = base64_to_image(image_data)
        result = fr_system.recognize_face(img, threshold)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return JSONResponse(content=result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/faces")
async def list_faces():
    """List all registered faces"""
    try:
        result = fr_system.list_registered_faces()
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/faces/{name}")
async def delete_face(name: str):
    """Delete a registered face"""
    try:
        result = fr_system.delete_face(name)
        
        if not result["success"]:
            raise HTTPException(status_code=404, detail=result["error"])
        
        return JSONResponse(content=result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)