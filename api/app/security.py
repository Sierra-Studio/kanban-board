"""Password hashing, identifier generation, and small crypto helpers.

Uses only the Python standard library (``hashlib.pbkdf2_hmac``) so the API has
no native build dependencies. Password hashes are stored in the format:

    pbkdf2_sha256$<iterations>$<salt_hex>$<hash_hex>
"""

import hashlib
import hmac
import secrets
import uuid

_PBKDF2_ITERATIONS = 200_000
_PBKDF2_ALGO = "sha256"
_SALT_BYTES = 16


def generate_user_id() -> str:
    return str(uuid.uuid4())


def generate_entity_id() -> str:
    """Mirror Drizzle's ``lower(hex(randomblob(16)))`` — 32 lowercase hex chars."""
    return secrets.token_hex(16)


def generate_session_token() -> str:
    return secrets.token_hex(32)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(_SALT_BYTES)
    derived = hashlib.pbkdf2_hmac(
        _PBKDF2_ALGO, password.encode("utf-8"), salt, _PBKDF2_ITERATIONS
    )
    return f"pbkdf2_{_PBKDF2_ALGO}${_PBKDF2_ITERATIONS}${salt.hex()}${derived.hex()}"


def verify_password(password: str, stored: str | None) -> bool:
    if not stored:
        return False
    try:
        scheme, iterations_str, salt_hex, hash_hex = stored.split("$")
        algo = scheme.replace("pbkdf2_", "")
        iterations = int(iterations_str)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(hash_hex)
    except (ValueError, AttributeError):
        return False

    derived = hashlib.pbkdf2_hmac(algo, password.encode("utf-8"), salt, iterations)
    return hmac.compare_digest(derived, expected)
