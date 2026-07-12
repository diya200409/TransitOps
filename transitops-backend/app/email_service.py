"""
TransitOps — Email service for sending SMTP notifications.
Uses stdlib smtplib/email. Falls back gracefully if SMTP is not configured.
"""

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from .config import (
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASSWORD,
    SMTP_FROM,
    SMTP_USE_TLS,
)


def is_smtp_configured() -> bool:
    """Check whether minimum SMTP settings are present."""
    return bool(SMTP_HOST and SMTP_PORT and SMTP_FROM)


def send_email(to: str, subject: str, body_html: str) -> bool:
    """
    Send an HTML email via SMTP.
    Returns True on success, False on failure (logs to stdout).
    """
    if not is_smtp_configured():
        print(f"[EMAIL] SMTP not configured — skipping email to {to}")
        return False

    msg = MIMEMultipart("alternative")
    msg["From"] = SMTP_FROM
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(body_html, "html"))

    try:
        if SMTP_USE_TLS:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
            server.starttls()
        else:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)

        if SMTP_USER and SMTP_PASSWORD:
            server.login(SMTP_USER, SMTP_PASSWORD)

        server.sendmail(SMTP_FROM, to, msg.as_string())
        server.quit()
        print(f"[EMAIL] Sent to {to}: {subject}")
        return True
    except Exception as e:
        print(f"[EMAIL] Failed to send to {to}: {e}")
        return False


def send_license_expiry_reminder(
    driver_name: str,
    license_number: str,
    expiry_date: str,
    days_until: int,
    to_email: str,
) -> bool:
    """Build and send a formatted license expiry reminder email."""
    if days_until < 0:
        urgency = "EXPIRED"
        color = "#dc3545"
        message = f"expired <strong>{abs(days_until)}</strong> day(s) ago"
    elif days_until == 0:
        urgency = "EXPIRES TODAY"
        color = "#dc3545"
        message = "expires <strong>today</strong>"
    elif days_until <= 7:
        urgency = "URGENT"
        color = "#fd7e14"
        message = f"expires in <strong>{days_until}</strong> day(s)"
    else:
        urgency = "REMINDER"
        color = "#ffc107"
        message = f"expires in <strong>{days_until}</strong> day(s)"

    subject = f"[TransitOps] {urgency}: Driver license expiring — {driver_name}"

    body_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: {color}; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">⚠️ License Expiry {urgency}</h2>
        </div>
        <div style="border: 1px solid #e0e0e0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
            <p>The driving license for the following driver {message}:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr>
                    <td style="padding: 8px 12px; border: 1px solid #e0e0e0; font-weight: bold; width: 40%;">Driver Name</td>
                    <td style="padding: 8px 12px; border: 1px solid #e0e0e0;">{driver_name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 12px; border: 1px solid #e0e0e0; font-weight: bold;">License Number</td>
                    <td style="padding: 8px 12px; border: 1px solid #e0e0e0;">{license_number}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 12px; border: 1px solid #e0e0e0; font-weight: bold;">Expiry Date</td>
                    <td style="padding: 8px 12px; border: 1px solid #e0e0e0;">{expiry_date}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 12px; border: 1px solid #e0e0e0; font-weight: bold;">Days Until Expiry</td>
                    <td style="padding: 8px 12px; border: 1px solid #e0e0e0; color: {color}; font-weight: bold;">
                        {days_until if days_until >= 0 else f"{abs(days_until)} days overdue"}
                    </td>
                </tr>
            </table>
            <p>Please ensure that the driver's license is renewed before the expiry date to maintain compliance.</p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 16px 0;">
            <p style="color: #888; font-size: 12px;">This is an automated notification from TransitOps.</p>
        </div>
    </div>
    """

    return send_email(to_email, subject, body_html)
