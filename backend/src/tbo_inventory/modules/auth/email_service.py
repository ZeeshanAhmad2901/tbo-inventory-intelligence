import logging
import smtplib
from email.message import EmailMessage

from tbo_inventory.config import settings

logger = logging.getLogger(__name__)


def send_password_reset_email(email: str, token: str) -> None:
    reset_url = (
        f"{settings.frontend_url.rstrip('/')}/reset-password"
        f"?token={token}"
    )

    if not settings.smtp_host or not settings.smtp_sender_email:
        if settings.app_env.lower() in {"local", "development", "dev"}:
            logger.info(
                "Development password-reset link for %s: %s",
                email,
                reset_url,
            )
        return

    message = EmailMessage()
    message["Subject"] = "Reset your TBO Inventory Intelligence password"
    message["From"] = settings.smtp_sender_email
    message["To"] = email
    message.set_content(
        "We received a request to reset your password.\n\n"
        f"Use this link within {settings.password_reset_ttl_minutes} minutes:\n"
        f"{reset_url}\n\n"
        "If you did not request this, you can ignore this email."
    )

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
        if settings.smtp_use_tls:
            smtp.starttls()
        if settings.smtp_username and settings.smtp_password:
            smtp.login(settings.smtp_username, settings.smtp_password)
        smtp.send_message(message)
