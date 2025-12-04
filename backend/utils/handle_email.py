import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
from jinja2 import Template

load_dotenv()

EMAIL_HOST = os.getenv("EMAIL_HOST")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")


def send_email(to: str, subject: str, body: str) -> None:
    """
    Envía un correo usando SMTP y una plantilla HTML.
    """

    # Leer plantilla HTML
    template_path = os.path.join("templates", "emailTemplate.html")
    with open(template_path, "r", encoding="utf-8") as f:
        html_template = Template(f.read())

    # Renderizar plantilla
    html_content = html_template.render(name=to.split("@")[0], body=body)

    # Crear mensaje
    msg = EmailMessage()
    msg["From"] = EMAIL_USER
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    msg.add_alternative(html_content, subtype="html")

    # Enviar correo
    with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASS)
        server.send_message(msg)

    print(f"📧 Email enviado a {to}")
