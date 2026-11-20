import hashlib
import hmac
import secrets

from pwdlib import PasswordHash, exceptions

_password_hasher = PasswordHash.recommended()


def normalize_email(email: str) -> str:
    return email.strip().casefold()


def hash_password(password: str) -> str:
    return _password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _password_hasher.verify(password, password_hash)
    except (ValueError, TypeError, exceptions.PwdlibError):
        return False


def generate_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_csrf_token(session_token: str, secret_key: str) -> str:
    nonce = secrets.token_urlsafe(32)
    message = f"{session_token}:{nonce}".encode()
    signature = hmac.new(
        secret_key.encode("utf-8"),
        message,
        hashlib.sha256,
    ).hexdigest()
    return f"{nonce}.{signature}"


def verify_csrf_token(
    csrf_token: str,
    session_token: str,
    secret_key: str,
) -> bool:
    try:
        nonce, supplied_signature = csrf_token.rsplit(".", 1)
    except ValueError:
        return False

    if (
        not nonce
        or len(supplied_signature) != 64
        or any(character not in "0123456789abcdef" for character in supplied_signature)
    ):
        return False

    message = f"{session_token}:{nonce}".encode()
    expected_signature = hmac.new(
        secret_key.encode("utf-8"),
        message,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(supplied_signature, expected_signature)
