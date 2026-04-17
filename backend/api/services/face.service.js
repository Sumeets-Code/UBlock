import dotenv from "dotenv";
dotenv.config();

const BASE_URL = (
  process.env.FACE_RECOGNITION_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");
const SERVICE_SECRET =
  process.env.FACE_SERVICE_SECRET || "CHANGE_ME_IN_PRODUCTION";
const TIMEOUT_MS = 120_000; // 120 s — model inference can be slow on first call

if (!process.env.FACE_SERVICE_SECRET) {
  console.warn(
    "⚠  FACE_SERVICE_SECRET not set in .env — using default (insecure)",
  );
}

// ── Base fetch wrapper ────────────────────────────────────────────────────────
const faceRequest = async (method, path, body = null) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Service-Secret": SERVICE_SECRET,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    // Try this if service is down
    let data;
    try {
      data = await res.json();
    } catch {
      const err = new Error(
        `Face service unreachable or returned non-JSON (HTTP ${res.status})`,
      );
      err.status = res.status || 502;
      throw err;
    }

    if (!res.ok) {
      const msg =
        data?.detail || data?.message || `Face service error: ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.name === "AbortError") {
      const e = new Error(
        `Face service timed out after ${TIMEOUT_MS / 1000}s. Is the Python service running on ${BASE_URL}?`,
      );
      e.status = 504;
      throw e;
    }

    // Network error (ECONNREFUSED) — give a helpful message
    if (
      err.cause?.code === "ECONNREFUSED" ||
      err.message?.includes("fetch failed")
    ) {
      const e = new Error(
        `Cannot connect to face service at ${BASE_URL}. Run: uvicorn app.main:app --port 8000`,
      );
      e.status = 503;
      throw e;
    }

    throw err;
  } finally {
    clearTimeout(timer);
  }
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Register a user's face encoding.
 * @param {string} userId      MongoDB _id
 * @param {string} base64Image base64 string (data URL or raw)
 * @returns {{ success, user_id, encodings_stored, message }}
 */
const registerFace = (userId, base64Image) =>
  faceRequest("POST", "/face/register-b64", {
    user_id: userId,
    image_data: base64Image,
  });

/**
 * Verify that a face matches a specific registered user (1-to-1).
 * @param {string} userId
 * @param {string} base64Image
 * @returns {{ verified: boolean, similarity: number, message: string }}
 */
const verifyFace = (userId, base64Image) =>
  faceRequest("POST", "/face/verify-b64", {
    user_id: userId,
    image_data: base64Image,
  });

/**
 * 1-to-N recognition — find out who is in the image.
 * @param {string} base64Image
 * @returns {{ matched: boolean, user_id: string|null, similarity: number }}
 */
const recognizeFace = (base64Image) =>
  faceRequest("POST", "/face/recognize-b64", { image_data: base64Image });

// Delete all face encodings for a user.
const deleteFace = (userId) =>
  faceRequest("DELETE", `/face/${encodeURIComponent(userId)}`);


// Non-throwing health check. Returns true if the service is reachable.
const isAvailable = async () => {
  try {
    const res = await fetch(`${BASE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
};

export default {
  registerFace,
  verifyFace,
  recognizeFace,
  deleteFace,
  isAvailable,
};
