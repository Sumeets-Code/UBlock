import cv2
import numpy as np
from pymongo import MongoClient
from datetime import datetime
from deepface import DeepFace
from dotenv import load_dotenv
import os

load_dotenv()

class FaceRecognitionSystem:
    def __init__(self, mongodb_uri=os.getenv("MONGO_URI"), db_name="face_recognition"):
        """Initialize the face recognition system with MongoDB connection"""
        self.client = MongoClient(mongodb_uri)
        self.db = self.client[db_name]
        self.faces_collection = self.db['faces']
        self.logs_collection = self.db['recognition_logs']
        self.model_name = "Facenet"  # Options: VGG-Face, Facenet, OpenFace, DeepFace, DeepID, ArcFace
        
    def register_face(self, name, image_path=None, use_webcam=False):
        """Register a new face in the database"""
        if use_webcam:
            image_path = self._capture_from_webcam()
            if image_path is None:
                print("Failed to capture image from webcam")
                return False
        elif not image_path:
            print("Please provide either image_path or set use_webcam=True")
            return False
        
        try:
            # Extract face embedding using DeepFace
            embedding_objs = DeepFace.represent(
                img_path=image_path,
                model_name=self.model_name,
                enforce_detection=True
            )
            
            if len(embedding_objs) == 0:
                print("No face detected in the image")
                return False
            
            if len(embedding_objs) > 1:
                print("Multiple faces detected. Please provide an image with only one face")
                return False
            
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
                print(f"Updated face embedding for {name}")
            else:
                self.faces_collection.insert_one(face_data)
                print(f"Registered new face for {name}")
            
            # Clean up temp file if from webcam
            if use_webcam and os.path.exists(image_path):
                os.remove(image_path)
            
            return True
            
        except Exception as e:
            print(f"Error registering face: {str(e)}")
            return False
    
    def _capture_from_webcam(self):
        """Capture image from webcam and save temporarily"""
        video_capture = cv2.VideoCapture(0)
        print("Press SPACE to capture, ESC to cancel")
        
        temp_path = None
        
        while True:
            ret, frame = video_capture.read()
            if not ret:
                break
            
            # Draw face detection rectangle
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            faces = face_cascade.detectMultiScale(gray, 1.3, 5)
            
            for (x, y, w, h) in faces:
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            
            cv2.imshow('Capture Face - Press SPACE', frame)
            
            key = cv2.waitKey(1)
            if key == 32:  # SPACE key
                temp_path = f"temp_capture_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
                cv2.imwrite(temp_path, frame)
                break
            elif key == 27:  # ESC key
                temp_path = None
                break
        
        video_capture.release()
        cv2.destroyAllWindows()
        return temp_path
    
    def recognize_faces(self, image_path=None, use_webcam=False, threshold=0.4):
        """Recognize faces in an image or from webcam"""
        if use_webcam:
            return self._recognize_from_webcam(threshold)
        elif image_path:
            return self._process_recognition(image_path, threshold)
        else:
            print("Please provide either image_path or set use_webcam=True")
            return []
    
    def _cosine_distance(self, vec1, vec2):
        """Calculate cosine distance between two vectors"""
        vec1 = np.array(vec1)
        vec2 = np.array(vec2)
        return 1 - np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))
    
    def _process_recognition(self, image_path, threshold=0.4):
        """Process face recognition on a given image"""
        try:
            # Extract embeddings from the image
            embedding_objs = DeepFace.represent(
                img_path=image_path,
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
                    'location': facial_area
                }
                
                recognized_faces.append(result)
                
                # Log recognition
                self.logs_collection.insert_one({
                    'name': name,
                    'confidence': float(confidence),
                    'timestamp': datetime.now(),
                    'location': facial_area
                })
            
            return recognized_faces
            
        except Exception as e:
            print(f"Error during recognition: {str(e)}")
            return []
    
    def _recognize_from_webcam(self, threshold=0.4):
        """Real-time face recognition from webcam"""
        video_capture = cv2.VideoCapture(0)
        
        # Load all known faces from MongoDB
        known_faces = list(self.faces_collection.find())
        
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        print("Press ESC to exit")
        frame_count = 0
        
        while True:
            ret, frame = video_capture.read()
            if not ret:
                break
            
            frame_count += 1
            
            # Process every 30 frames for performance
            if frame_count % 30 == 0:
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = face_cascade.detectMultiScale(gray, 1.3, 5)
                
                for (x, y, w, h) in faces:
                    # Extract face region
                    face_img = frame[y:y+h, x:x+w]
                    temp_path = "temp_webcam_face.jpg"
                    cv2.imwrite(temp_path, face_img)
                    
                    try:
                        # Get embedding
                        embedding_objs = DeepFace.represent(
                            img_path=temp_path,
                            model_name=self.model_name,
                            enforce_detection=False
                        )
                        
                        if len(embedding_objs) > 0:
                            embedding = embedding_objs[0]['embedding']
                            
                            best_match = None
                            best_distance = float('inf')
                            
                            for known_face in known_faces:
                                distance = self._cosine_distance(embedding, known_face['embedding'])
                                
                                if distance < best_distance and distance < threshold:
                                    best_distance = distance
                                    best_match = known_face['name']
                            
                            name = best_match if best_match else "Unknown"
                            confidence = 1 - best_distance if best_match else 0
                            
                            # Draw rectangle and label
                            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                            cv2.rectangle(frame, (x, y+h-35), (x+w, y+h), (0, 255, 0), cv2.FILLED)
                            cv2.putText(frame, f"{name} ({confidence:.2f})", (x+6, y+h-6),
                                       cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 255, 255), 1)
                        
                        os.remove(temp_path)
                        
                    except Exception as e:
                        # Draw rectangle only
                        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            
            cv2.imshow('Face Recognition - Press ESC to exit', frame)
            
            if cv2.waitKey(1) == 27:  # ESC key
                break
        
        video_capture.release()
        cv2.destroyAllWindows()
        return []
    
    def list_registered_faces(self):
        """List all registered faces"""
        faces = list(self.faces_collection.find({}, {'name': 1, 'registered_at': 1, '_id': 0}))
        return faces
    
    def delete_face(self, name):
        """Delete a registered face"""
        result = self.faces_collection.delete_one({'name': name})
        if result.deleted_count > 0:
            print(f"Deleted face for {name}")
            return True
        else:
            print(f"No face found for {name}")
            return False
    
    def get_recognition_logs(self, limit=10):
        """Get recent recognition logs"""
        logs = list(self.logs_collection.find().sort('timestamp', -1).limit(limit))
        return logs


# Example usage
if __name__ == "__main__":
    # Initialize the system
    fr_system = FaceRecognitionSystem()
    
    # Example 1: Register a face from an image file
    # fr_system.register_face("John Doe", image_path="path/to/john.jpg")
    
    # Example 2: Register a face from webcam
    # fr_system.register_face("Jane Smith", use_webcam=True)
    
    # Example 3: Recognize faces from an image
    # results = fr_system.recognize_faces(image_path="path/to/group_photo.jpg")
    # print("Recognized faces:", results)
    
    # Example 4: Real-time recognition from webcam
    # fr_system.recognize_faces(use_webcam=True)
    
    # Example 5: List all registered faces
    # registered = fr_system.list_registered_faces()
    # print("Registered faces:", registered)
    
    # Example 6: Get recognition logs
    # logs = fr_system.get_recognition_logs(limit=5)
    # print("Recent logs:", logs)
    
    # Example 7: Delete a face
    # fr_system.delete_face("John Doe")
    
    print("Face Recognition System initialized. Uncomment examples to use.")