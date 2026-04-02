// Face Recognition Client — communicates with the Python ML microservice
// The Python service should be running on http://localhost:8000 (see ml_service/)

export class FaceRecognitionClient {
  constructor(baseUrl = process.env.FACE_RECOGNITION_URL || 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  async registerFace(name, imageFile) {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('image', imageFile);
    return this._post('/register', formData);
  }

  async registerFaceBase64(name, base64Image) {
    return this._postJSON('/register-base64', { name, image_data: base64Image });
  }

  async recognizeFace(imageFile, threshold = 0.4) {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('threshold', threshold.toString());
    return this._post('/recognize', formData);
  }

  async recognizeFaceBase64(base64Image, threshold = 0.4) {
    return this._postJSON('/recognize-base64', { image_data: base64Image, threshold });
  }

  async listFaces() {
    const res = await fetch(`${this.baseUrl}/faces`);
    if (!res.ok) throw new Error('Failed to fetch faces');
    return res.json();
  }

  async deleteFace(name) {
    const res = await fetch(`${this.baseUrl}/faces/${name}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Deletion failed');
    }
    return res.json();
  }

  async healthCheck() {
    const res = await fetch(`${this.baseUrl}/health`);
    return res.json();
  }

  async _post(endpoint, formData) {
    const res = await fetch(`${this.baseUrl}${endpoint}`, { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || `Request to ${endpoint} failed`);
    }
    return res.json();
  }

  async _postJSON(endpoint, body) {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || `Request to ${endpoint} failed`);
    }
    return res.json();
  }
}

export default new FaceRecognitionClient();
