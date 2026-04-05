"""
Thread-safe in-memory face encoding store with pickle persistence.

Each user can have up to ENCODINGS_PER_USER face vectors stored.
All vectors are unit-normalised; similarity is measured by cosine dot product.
"""

import os
import pickle
import threading
import logging
import numpy as np
from typing import Dict, List, Optional, Tuple

from app.core.config import settings

logger = logging.getLogger("ublock.face.store")


class FaceStore:
    """
    Maps user_id (MongoDB _id string) → list of unit-norm face encodings.
    """

    def __init__(self):
        self._lock = threading.RLock()
        # { user_id: [np.ndarray(512,), ...] }
        self._data: Dict[str, List[np.ndarray]] = {}

    # ── Persistence ───────────────────────────────────────────────────────────

    def _path(self) -> str:
        return os.path.join(settings.DATA_DIR, settings.STORE_FILE)

    def load(self) -> None:
        path = self._path()
        if not os.path.exists(path):
            logger.info("No face store file found — starting fresh")
            return
        with self._lock:
            with open(path, "rb") as f:
                self._data = pickle.load(f)
        logger.info(f"Loaded {len(self._data)} user(s) from {path}")

    def save(self) -> None:
        os.makedirs(settings.DATA_DIR, exist_ok=True)
        with self._lock:
            with open(self._path(), "wb") as f:
                pickle.dump(self._data, f, protocol=pickle.HIGHEST_PROTOCOL)
        logger.debug(f"Saved {len(self._data)} user(s) to {self._path()}")

    # ── Write ─────────────────────────────────────────────────────────────────

    def add_encoding(self, user_id: str, encoding: np.ndarray) -> int:
        """
        Add a face encoding for a user.
        Keeps at most ENCODINGS_PER_USER vectors (rolling window).
        Returns the total number of encodings stored for this user.
        """
        enc = _unit_norm(encoding)
        with self._lock:
            if user_id not in self._data:
                self._data[user_id] = []
            self._data[user_id].append(enc)
            # Rolling window
            if len(self._data[user_id]) > settings.ENCODINGS_PER_USER:
                self._data[user_id].pop(0)
            count = len(self._data[user_id])
        self.save()
        return count

    def delete_user(self, user_id: str) -> bool:
        with self._lock:
            existed = user_id in self._data
            self._data.pop(user_id, None)
        if existed:
            self.save()
        return existed

    def has_user(self, user_id: str) -> bool:
        with self._lock:
            return user_id in self._data and len(self._data[user_id]) > 0

    # ── Read / match ──────────────────────────────────────────────────────────

    def find_match(
        self,
        probe: np.ndarray,
        threshold: Optional[float] = None,
    ) -> Tuple[Optional[str], float]:
        """
        1-to-N search: compare probe against every stored user.
        Returns (best_user_id, best_similarity) or (None, score) if below threshold.
        """
        thresh = threshold or settings.SIMILARITY_THRESHOLD
        probe_norm = _unit_norm(probe)

        best_id: Optional[str] = None
        best_score: float = -1.0

        with self._lock:
            for user_id, encodings in self._data.items():
                # Mean similarity across all stored encodings for this user
                scores = [float(np.dot(probe_norm, e)) for e in encodings]
                mean_score = sum(scores) / len(scores)
                if mean_score > best_score:
                    best_score = mean_score
                    best_id = user_id

        if best_score >= thresh:
            return best_id, best_score
        return None, best_score

    def verify_user(
        self,
        user_id: str,
        probe: np.ndarray,
        threshold: Optional[float] = None,
    ) -> Tuple[bool, float]:
        """
        1-to-1 verification: does this probe match the stored user?
        """
        thresh = threshold or settings.SIMILARITY_THRESHOLD
        probe_norm = _unit_norm(probe)

        with self._lock:
            encodings = self._data.get(user_id, [])

        if not encodings:
            return False, 0.0

        scores = [float(np.dot(probe_norm, e)) for e in encodings]
        mean_score = sum(scores) / len(scores)
        return mean_score >= thresh, mean_score

    def list_users(self) -> List[str]:
        with self._lock:
            return list(self._data.keys())

    def __len__(self) -> int:
        with self._lock:
            return len(self._data)


def _unit_norm(v: np.ndarray) -> np.ndarray:
    norm = np.linalg.norm(v)
    return v / norm if norm > 1e-10 else v


# Singleton — shared across all requests in the same process
face_store = FaceStore()
