
import os
import smtplib
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from .extradb_errors import extractdb_errormsg

def mail_sender(to_list,subject , pdf_path):
    try:
        username=os.environ.get('MAIL_USERNAME')
        password=os.environ.get('MAIL_PASSWORD')
        sender_mail=os.environ.get('SENDER_MAIL')

        port = 587
        smtp_server="mail.grid-india.in"
        server = smtplib.SMTP(smtp_server,port)
        server.starttls()
        server.login(username,password)
        cc="srldcscada@grid-india.in"
        
        html_body = """
            <html>
                <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    p { margin-bottom: 20px; }
                    strong { color: #000; }
                </style>
                </head>
                <body>
                <p>Dear Sir/Madam,
                <br><br><strong>Please find the attachment</strong><br>
                <br>Kindly reply at the earliest / कृपया यथाशीघ्र उत्तर दें  
                </p>
                <br><strong>Thanks and Regards</strong><br> 
                <strong>SRLDC SCADA</strong><br> 
                <strong>System Logistics</strong><br>
                </body>
            </html>
                    """
        
        message = MIMEMultipart('alternative')
        message["Subject"] =subject
        message["To"] = ",".join(to_list) 
        message["Cc"] = cc
        toaddrs = to_list + cc.split(',')
        message.attach(MIMEText(html_body,'html'))
        # Attach PDF if provided
        if pdf_path and os.path.exists(pdf_path):
            with open(pdf_path, "rb") as pdf_file:
                pdf_attachment = MIMEBase('application', 'octet-stream')
                pdf_attachment.set_payload(pdf_file.read())
                encoders.encode_base64(pdf_attachment)
                pdf_attachment.add_header(
                    'Content-Disposition',
                    f'attachment; filename="{os.path.basename(pdf_path)}"'
                )
                message.attach(pdf_attachment)
        
        server.sendmail(sender_mail,toaddrs, message.as_string())
      
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        extractdb_errormsg(e)
        return False