from django.template.loader import get_template
from django.http import HttpResponse , JsonResponse , FileResponse
from datetime import datetime
from fpdf import FPDF
import os , pandas as pd , pdb , json
from .models import ScadaTelemetryReport , RTUMaster ,RTUReportMessageCount
from itertools import chain
from django.db.models import Max
from .mail import mail_sender
import ast
from PIL import Image
from django.utils.dateparse import parse_datetime
from django.db.models import Q
from .extradb_errors import extractdb_errormsg , letter_head_fullpath , rtu_folder_path

from django.db.models import Q, Count
import time 
from collections import defaultdict

def downloadRTUTemplate(request):
    try:
        # download data from SCADATelemetryReport table and send csv file  
        df = pd.DataFrame(RTUMaster.objects.order_by('link').all().values())
        # remove nan with empty
        df = df.fillna('')
        # drop id column
        if 'id' in df.columns:
            df.drop(columns=['id'], inplace=True)
        if df.empty:
            return HttpResponse("No data available to download.", status=404)
        # Create a CSV file from the DataFrame
        if not os.path.exists('RTU'):
            os.makedirs('RTU')
        csv_file_path = os.path.join('RTU', 'RTU_Master_Template.csv')
        df.to_csv(csv_file_path, index=False)
        # Check if the file was created successfully
        if os.path.exists(csv_file_path):
            # Save as CSV
            response = FileResponse(open(csv_file_path, 'rb'), content_type='text/csv')
            response['Content-Disposition'] = 'attachment'
        
        return response

    except Exception as e:
        extractdb_errormsg(e)
        return HttpResponse(f"Internal server error: {e}", status=500)

def uploadRTUMaster(request):
    try:  
        uploaded_file = request.FILES.get('file')
        # check file extension 
        if uploaded_file.name.split('.')[1] == 'csv':
            read_df = pd.read_csv(uploaded_file)
          
            for _, row in read_df.iterrows():
                try:
                    # Create or update RTUMaster entries
                    RTUMaster.objects.update_or_create(
                        link=row['link'],  # <-- Lookup condition
                        defaults={
                            'protocol': row['protocol'],
                            'responsibility': row['responsibility'],
                            'linkMailList': ast.literal_eval(row['linkMailList']) if isinstance(row['linkMailList'], str) else row['linkMailList'],
                            'mcc_m': row['mcc_m'],
                            'mcc_s': row['mcc_s'],
                            'bcc_m': row['bcc_m'],
                            'bcc_s': row['bcc_s'],
                            'rtu_type':row['rtu_type'].upper()
                        }
                    )
                except Exception as e:
                    extractdb_errormsg(str(e))
                    return JsonResponse({"status": False, "message": row['link'] + 'Some error occured '+ str(e) +' check once'}, status=200)
               
            return JsonResponse({"status": True, "message": "RTU Master data uploaded successfully."}, status=200)
        else:
            return JsonResponse({"status": False, "message": "Invalid file format. Please upload a CSV file."}, status=400)
        
    except Exception as e:
        extractdb_errormsg(str(e))
        return JsonResponse({"status": False, "message": "Invalid file format. Please upload a CSV file."}, status=400)
     
def createfolderforRecon(start_date):
    try:
        foldername = "RTU\\"+ start_date.strftime('%d-%m-%Y')+'\\'
        try:   
            if not os.path.exists(os.path.dirname(foldername)):
                os.makedirs(os.path.dirname(foldername))
        except IOError:
            pass

    except Exception as e:
        extractdb_errormsg(str(e))
        


# Count number of lines needed
def count_lines(pdf, text, col_width):
    words = str(text).split()
    lines = []
    current = ""
    for word in words:
        if pdf.get_string_width(current + " " + word) <= col_width:
            current += " " + word if current else word
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return len(lines)

def generate_message_no():
    try:
        # 1. Get current month abbreviation and year
        current_month = datetime.now().strftime('%b')  # e.g., 'Jul'
        current_year = datetime.now().strftime('%Y')   # e.g., '2025'

        # 2. Get the last counter value from the MessageCounter table
        last_counter = RTUReportMessageCount.objects.filter(year = current_year , month = current_month).aggregate(Max('message_no'))['message_no__max'] or 0
        new_counter = last_counter + 1
        # 3. Create a new entry in the RTUReportMessageCount table with the incremented counter
        RTUReportMessageCount.objects.create(year = current_year , month = current_month ,message_no=new_counter)
        # 3. Return formatted message number
        return f"SRLDC/STR/{current_month}/{current_year}/{new_counter}"
    except Exception as e:
        extractdb_errormsg(str(e))
        return None
    
# Function to split rows into Main & Standby
def split_channels(df , entity):
    split_rows = []
    if entity == 'SRLDC':
        for _, row in df.iterrows():
            # Main Channel row
            split_rows.append([
                row['Link'] ,
                row['Protocol'],
                'Main',
                row['Main Channel'],
                row['Main Channel Status'],
                row['Main Outage Time'],
                row['MDowntime(HH:MM)']  # Main downtime
            ])
        
            # Standby Channel row
            split_rows.append([
                row['Link'] ,
                row['Protocol'],
                'Standby',
                row['Stand By Channel'],
                row['Stand By Channel Status'],
                row['Stand By Outage Time'],
                row['SDowntime(HH:MM)']   # Last column = Standby Downtime
            ])
        return pd.DataFrame(split_rows, columns=[
        'Station','Protocol','Channel', 'Status' , 'Remarks', 'Outage Time', 'Downtime(HH:MM)'
        ])
    else:
        for _, row in df.iterrows():
            # Main Channel row
            split_rows.append([
                'Main',
                row['Main Channel'],
                row['Main Channel Status'],
                row['Main Outage Time'],
                row['MDowntime(HH:MM)']  # Main downtime
            ])
        
            # Standby Channel row
            split_rows.append([
                'Standby',
                row['Stand By Channel'],
                row['Stand By Channel Status'],
                row['Stand By Outage Time'],
                row['SDowntime(HH:MM)']   # Last column = Standby Downtime
            ])
        return pd.DataFrame(split_rows, columns=[
        'Channel', 'Status' , 'Remarks', 'Outage Time', 'Downtime(HH:MM)'
        ])
    
def sort_by_downtime(df, col="Downtime(HH:MM)"):
    df["_Downtime"] = pd.to_timedelta(df[col] + ":00")
    df = df.sort_values("_Downtime", ascending=False).drop(columns="_Downtime").reset_index(drop=True)
    return df

def generatePDFFunc(letter_head_path ,letter_date,link , pdf_headers, data_rows ,protocol ,responsibility , entity):
    try:
        letter_date_dt = datetime.strptime(letter_date, '%Y-%m-%d').strftime('%d-%m-%Y') if letter_date else None

        filename = f"{link}_{letter_date_dt}.pdf" 

        folder_path = os.path.join(rtu_folder_path, letter_date_dt)

        if not os.path.exists(folder_path):
            os.makedirs(folder_path)
        
        pdf_path = os.path.join(folder_path, filename)
       
        pdf = FPDF(format='A4')
        pdf.add_page()

        #get original image size
        img = Image.open(letter_head_path)
        img_width, img_height = img.size

        # PDF page dimensions
        page_width = pdf.w
        max_width = page_width    # Scale to 60% of page width (adjust as needed)
        max_height = 80                # Keep height limit

        # Maintain aspect ratio
        aspect_ratio = img_height / img_width
        display_width = min(max_width, max_height / aspect_ratio)
        display_height = display_width * aspect_ratio

        # Calculate x to center the image
        x_center = (page_width - display_width) / 2

        # Add image with proper scaling
        pdf.image(letter_head_path, x=x_center, y=10, w=display_width, h=display_height)
        # Move cursor below the image
        pdf.set_y(95)
        # Move below the image
        pdf.set_font("Times", style="B", size=14)
        pdf.cell(0, 10, f'Status of Non-Reporting RTUs of MCC/BCC of SRLDC -- {link}', ln=True, align='C')
        # Add Ref.No and Date in a single line
        pdf.set_font("Times",size=12)
        pdf.cell(0, 10, f' Message No : {generate_message_no()}', ln=0)
        pdf.cell(0, 10, f" Date: {letter_date_dt} ", ln=1, align='R')
        # pdf.ln(10)  # Add a line break after the table

        if entity != 'SRLDC':
            pdf.cell(0, 10, f' Protocol : {protocol}', ln=0)
            pdf.cell(0, 10, f" Responsibility: {responsibility}", ln=1, align='R')

            transformed_headers = ['Channel', 'Status' ,  'Outage Time',
                'Downtime(HH:MM)','Remarks']
            num_cols = len(transformed_headers)
            usable_width = pdf.w - 2 * pdf.l_margin
            # col_widths = [usable_width / num_cols] * num_cols
            line_height = 4

            width_ratios = [1] * num_cols
            if num_cols >= 5:
                width_ratios[1] = 2  # 2nd column
                width_ratios[2] = 2  # 3rd column
                width_ratios[4] = 3  # 5th column
        else:
            transformed_headers = ['Station','Protocol','Channel', 'Status' ,  'Outage Time',
                'Downtime(HH:MM)','Remarks']
            num_cols = len(transformed_headers)
            usable_width = pdf.w - 2 * pdf.l_margin
            # col_widths = [usable_width / num_cols] * num_cols
            line_height = 4

            width_ratios = [1] * num_cols
            if num_cols >= 7:
                width_ratios[0] = 1.5  # 1st column
                width_ratios[3] = 1.5  # 4th column
                width_ratios[4] = 2  # 5th column
                width_ratios[6] = 2  # 6th column 

        pdf.set_font("Times", "BI" , 10)
        # Define your column headers and column widths
        
        col_widths = [usable_width * (r / sum(width_ratios)) for r in width_ratios]
        # Draw a row (header or data)
        def draw_row(pdf, row, col_widths, line_height):
            max_lines = max(count_lines(pdf, str(cell), width) for cell, width in zip(row, col_widths))
            row_height = max_lines * line_height

            # Add page if needed
            if pdf.get_y() + row_height > pdf.h - pdf.b_margin:
                pdf.add_page()

            x_start = pdf.get_x()
            y_start = pdf.get_y()

            for i, (cell, width) in enumerate(zip(row, col_widths)):
                x = x_start + sum(col_widths[:i])
                pdf.set_xy(x, y_start)

                # Draw border
                pdf.rect(x, y_start, width, row_height)

                # Center text vertically
                actual_lines = count_lines(pdf, str(cell), width)
                offset_y = (row_height - (actual_lines * line_height)) / 2
                pdf.set_xy(x, y_start + offset_y)

                pdf.multi_cell(width, line_height, str(cell), border=0, align='C')

            pdf.set_y(y_start + row_height)

        # Create DataFrame
        df = pd.DataFrame(data_rows, columns=pdf_headers)
        
        # Split BCC and MCC
        bcc_split_df = split_channels(df[df['Channel Type'] == 'BCC'] , entity)
        mcc_split_df = split_channels(df[df['Channel Type'] == 'MCC'] , entity)
      

        # only for SRLDC not to entities
        if entity == 'SRLDC':
            #filter out only Not Reporting
            mcc_split_df = mcc_split_df[mcc_split_df["Status"] == "Not Reporting"]
            bcc_split_df = bcc_split_df[bcc_split_df["Status"] == "Not Reporting"]
            # chnage the order of columns , keep Remarks to last
            bcc_split_df = bcc_split_df[['Station', 'Protocol', 'Channel', 'Status','Outage Time','Downtime(HH:MM)', 'Remarks']].copy()
            mcc_split_df = mcc_split_df[['Station', 'Protocol', 'Channel', 'Status','Outage Time', 'Downtime(HH:MM)','Remarks']].copy()
        else:
            # filter out Reporting
            mcc_split_df = mcc_split_df[mcc_split_df["Status"] != "Reporting"]
            bcc_split_df = bcc_split_df[bcc_split_df["Status"] != "Reporting"]
            # chnage the order of columns , keep Remarks to last
            bcc_split_df = bcc_split_df[['Channel', 'Status','Outage Time','Downtime(HH:MM)', 'Remarks']].copy()
            mcc_split_df = mcc_split_df[['Channel', 'Status','Outage Time', 'Downtime(HH:MM)','Remarks']].copy()  

        # Remove NaT with None
        try:
            bcc_split_df["Outage Time"] = bcc_split_df["Outage Time"].dt.strftime("%Y-%m-%d %H:%M:%S").fillna("")
            mcc_split_df["Outage Time"] = mcc_split_df["Outage Time"].dt.strftime("%Y-%m-%d %H:%M:%S").fillna("")
            # Apply to both DataFrames
            bcc_split_df = sort_by_downtime(bcc_split_df)
            mcc_split_df = sort_by_downtime(mcc_split_df)
        except : pass
     
        # ******MCCC Draw header row
        pdf.set_font("Times", 'B', 10)
        pdf.cell(0, 10, f' Control Centre : Main Control Centre ', ln=True)
        draw_row(pdf, transformed_headers, col_widths, line_height)
        # Draw data rows
        pdf.set_font("Times", '', 10)
        for row in mcc_split_df.values.tolist():
            draw_row(pdf, row, col_widths, line_height)

        # ******BCC Draw header row
        pdf.set_font("Times", 'B', 10)
        pdf.cell(0, 10, f' Control Centre : Backup Control Centre ', ln=True)
        draw_row(pdf, transformed_headers, col_widths, line_height)
        pdf.set_font("Times", '', 10)
        for row in bcc_split_df.values.tolist():
            draw_row(pdf, row, col_widths, line_height)

        pdf.ln(10)  # Add a line break after the table
        pdf.set_font("Times", '', 10)
        pdf.multi_cell(0, 10,  f'Note : This intimation is in compliance to the Regulation 11 : Fault Reporting of CERC (Communication System for inter-State transmission of electricity) Regulations, 2017.Further, as per regulation 12 " All users of CTU, NLDC, RLDCs, SLDCs, STUs shall maintain the communication channel availability at 99.9% annually: Provided that with back up communication system, the availability of communication system should be 100%.' )

        pdf.cell(0, 8, "SRLDC SCADA", ln=1, align='R')
        pdf.cell(0, 8, "System Logistics", ln=1, align='R')

        # Output PDF
        pdf.output(pdf_path)
        return pdf_path
    except Exception as e:
        extractdb_errormsg(str(e))
        return None

def send_mail_func(pdf_path, emails,link):
    try:
        if pdf_path:
            mail_sender(emails, f"Status of Non-Reporting RTUs of MCC/BCC of SRLDC -- {link}", pdf_path)
            return True
        else : return False
    except Exception as e:
        extractdb_errormsg(str(e))
        return False

def pdfGenerationCode(letter_date , batch_no , batch_size):
    try:
        # 9️ Define headers for PDF
        headers = [
            'channel_type','mainChannel','mainChannelStatus', 'mainOutageTime','MDowntime',
            'standByChannel', 'standByChannelStatus' , 'standByOutageTime','SDowntime'
        ]
        pdf_headers = [
            'Channel Type','Main Channel', 'Main Channel Status', 'Main Outage Time', 'MDowntime(HH:MM)',
            'Stand By Channel', 'Stand By Channel Status', 'Stand By Outage Time', 'SDowntime(HH:MM)'
        ]

        # 9️ Group data by link and generate PDFs + Emails

        letter_head_path = letter_head_fullpath

        # 2️⃣ Load RTU master data
        entity_qs = RTUMaster.objects.all().order_by('link').values(
            'link', 'protocol', 'responsibility', 'linkMailList'
        )
        entity_df = pd.DataFrame(entity_qs)

        if batch_no == 1: # to send aggregated Mail to SRLDC SCADA Admin
            # 3️⃣ Load SCADA telemetry data for the given date
            rtu_qs = ScadaTelemetryReport.objects.filter(
                    Q(createdDate=letter_date , mail_sent=False)).values(
                    "link", "channel_type", "mainChannel", "mainOutageTime", "mainChannelStatus",
                    "standByChannel", "standByOutageTime", "standByChannelStatus", "createdDate" ,"id"
                )
        else:

            rtu_qs = ScadaTelemetryReport.objects.filter(
                    Q(createdDate=letter_date , mail_sent=False)).order_by('link').values(
                    "link", "channel_type", "mainChannel", "mainOutageTime", "mainChannelStatus",
                    "standByChannel", "standByOutageTime", "standByChannelStatus", "createdDate" ,"id"
                )[:batch_size]

            # Update mail_sent status for the batch
            ScadaTelemetryReport.objects.filter(id__in=[obj['id'] for obj in rtu_qs]).update(mail_sent=True)

        rtu_data_df = pd.DataFrame(rtu_qs , columns=["link", "channel_type", "mainChannel", "mainOutageTime", "mainChannelStatus",
                "standByChannel", "standByOutageTime", "standByChannelStatus", "createdDate" ,"id"])
        
        # 4️⃣ Check if there is data for the selected date
        if rtu_data_df.empty:
            return HttpResponse("No data available for the selected date.", status=404)

        # 5️⃣ Merge DataFrames
        merged_df = pd.merge(entity_df, rtu_data_df, on='link', how='right')

        # 6️⃣ Convert datetime columns safely
        for col in ['mainOutageTime', 'standByOutageTime', 'createdDate']:
            merged_df[col] = pd.to_datetime(merged_df[col], errors='coerce').dt.tz_localize(None)

        # Define the timedelta of 5 hours 30 minutes
        offset = pd.Timedelta(hours=5, minutes=30)

        # Apply only if the column is datetime
        for col in ["mainOutageTime", "standByOutageTime"]:
            if col in merged_df.columns:
                merged_df[col] = pd.to_datetime(merged_df[col], errors="coerce")  # ensure datetime
                merged_df[col] = merged_df[col].apply(lambda x: x + offset if pd.notnull(x) else x)

        # current datetime
        now = pd.Timestamp.now()
        # 7️⃣ Compute downtime columns
        merged_df['MDowntime'] = merged_df['mainOutageTime'].apply(
            lambda x: f"{int((now - x).total_seconds() // 3600):02}:{int(((now - x).total_seconds() % 3600) // 60):02}"
            if pd.notnull(x) else "00:00"
        )

        merged_df['SDowntime'] = merged_df['standByOutageTime'].apply(
            lambda x: f"{int((now - x).total_seconds() // 3600):02}:{int(((now - x).total_seconds() % 3600) // 60):02}"
            if pd.notnull(x) else "00:00"
        )

        # drop id column from merged_df
        if 'id' in merged_df.columns:
            merged_df.drop(columns=['id'], inplace=True)
        
        return headers , pdf_headers , letter_head_path , merged_df
    
    except Exception as e:
        extractdb_errormsg(str(e))
        return headers , pdf_headers , letter_head_path , pd.DataFrame([str(e)])
    
def previewReport(request):
    try:
        data = json.loads(request.body)
        letter_date_str = data['createddate']
        
        letter_date = parse_datetime(letter_date_str)
        if not letter_date:
            return HttpResponse("Invalid or missing 'createddate'.", status=400)
        
        headers , pdf_headers , letter_head_path , merged_df = pdfGenerationCode(letter_date)
        # sort based on link
        if merged_df.empty:
            return HttpResponse("No data available for the selected date.", status=404)
        
        merged_df = merged_df.sort_values(by='link', ascending=True)
        merged_df = merged_df.astype(object).where(pd.notnull(merged_df), None)

        headers1 = ['link','protocol','responsibility'] + headers
        pdf_headers1 = ['Link', 'Protocol', 'Responsibility'] + pdf_headers
        # Prepare data for PDF
        required_cols_df = merged_df[headers1]
        data_rows = required_cols_df.values.tolist()
        
        # Generate PDF
        pdf_path = generatePDFFunc(
            letter_head_path, letter_date_str, 'SRLDC',  pdf_headers1,
            data_rows ,'_' ,'_' ,'SRLDC'
        )
       
        # os.remove(os.path.join('RTU', letter_date.strftime('%d-%m-%Y')))
        response = FileResponse(open(pdf_path, 'rb'), content_type='application/pdf')
        response['Content-Disposition'] = 'attachment'
        
        return response
    except Exception as e:
        print(e)
        return HttpResponse(f"Internal server error: {e}", status=500)
    
def sendRTUReportMail(request):
    try:
        # 1️⃣ Parse and validate request body
        body = json.loads(request.body)
        letter_date_str = body.get('createddate')
        letter_date = parse_datetime(letter_date_str)

        
        # Validate letter_date
        if not letter_date:
            return HttpResponse("Invalid or missing 'createddate'.", status=400)

        headers , pdf_headers , letter_head_path , merged_df = pdfGenerationCode(letter_date)
        
        # generate separate for SRLDC and other entities  'Others'
        for ent in ['SRLDC' ,'Others']:
            if ent == 'SRLDC':
                merged_df = merged_df.astype(object).where(pd.notnull(merged_df), None)
                headers1 = ['link','protocol','responsibility'] + headers
                pdf_headers1 = ['Link', 'Protocol', 'Responsibility'] + pdf_headers
                # Prepare data for PDF
                required_cols_df = merged_df[headers1]
                data_rows = required_cols_df.values.tolist()
                
                # SRLDC Email list
                emails = ['sharathchand@grid-india.in' ,'rajkumar@grid-india.in','srldcotgr@grid-india.in']  
                
                # Generate PDF
                pdf_path = generatePDFFunc(
                    letter_head_path, letter_date_str, 'SRLDC',  pdf_headers1,
                    data_rows ,'_' ,'_' ,ent
                )
                send_mail_func(pdf_path, emails,'')
                time.sleep(5)  #wait for 5 seconds before sending next mail
            else:
                grouped = merged_df.groupby('link')
                for link, group_df in grouped:
                    protocol = group_df['protocol'].iloc[0] if pd.notnull(group_df['protocol'].iloc[0]) else ''
                    responsibility = group_df['responsibility'].iloc[0] if pd.notnull(group_df['responsibility'].iloc[0]) else ''

                    group_df = group_df.astype(object).where(pd.notnull(group_df), None)
                    # Prepare data for PDF
                    required_cols_df = group_df[headers]
                    data_rows = required_cols_df.values.tolist()

                    # Parse email list safely
                    email_lists = [item for item in group_df['linkMailList'].tolist() if item]
                    parsed_lists = []
                    for item in email_lists:
                        try:
                            parsed_lists.append(ast.literal_eval(item))
                        except Exception as e:
                            extractdb_errormsg(f"Error parsing email list for link {link}: {str(e)}")
                            continue

                    # Flatten unique emails . srldcscadaot mail for some days whether mails are going or not
                    emails = list({email for sublist in parsed_lists for email in sublist}) + ['srldcotgr@grid-india.in']
                    
                    # Generate PDF
                    pdf_path = generatePDFFunc(
                        letter_head_path, letter_date_str, link,  pdf_headers,
                        data_rows, protocol, responsibility ,ent
                    )
                    
                    send_mail_func(pdf_path, emails,link)
                    time.sleep(5)  #wait for 5 seconds before sending next mail

        return JsonResponse({"status" : True ,"message": "Reports generated and emails sent successfully."})

    except Exception as e:
        extractdb_errormsg(str(e))
        return HttpResponse(f"Internal server error: {e}", status=500)