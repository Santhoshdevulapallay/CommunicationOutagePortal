

from django.utils.dateparse import parse_datetime
import os ,pandas as pd , time ,ast
from discrepency.extradb_errors import extractdb_errormsg
from discrepency.generatePDFRTU import pdfGenerationCode, generatePDFFunc, send_mail_func
from django.core.management.base import BaseCommand
from datetime import date

class Command(BaseCommand):
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--batch_no',
            type=int,
            default=1,
            help='Batch number to process (starts from 1)'
        )
        parser.add_argument(
                '--batch_size',
                type=int,
                default=8,
                help='Number of mails per batch'
            )

    def handle(self,*args,**options):
        try:
            # 1️⃣ Parse and validate request body
            letter_date_str = date.today().strftime("%Y-%m-%d")
            letter_date = parse_datetime(letter_date_str)
            
            # Validate letter_date
            if not letter_date:
                return 
            
            batch_no = options['batch_no']
            batch_size = options['batch_size']

            headers , pdf_headers , letter_head_path , merged_df = pdfGenerationCode(letter_date , batch_no , batch_size)
            
            if  batch_no == 1:
                merged_df = merged_df.astype(object).where(pd.notnull(merged_df), None)
                headers1 = ['link','protocol','responsibility'] + headers
                pdf_headers1 = ['Link', 'Protocol', 'Responsibility'] + pdf_headers
                # Prepare data for PDF
                required_cols_df = merged_df[headers1]
                data_rows = required_cols_df.values.tolist()
                
                # SRLDC Email list

                emails = ['sharathchand@grid-india.in' ,'rajkumar@grid-india.in','srldcscada@grid-india.in']  

                # Generate PDF
                pdf_path = generatePDFFunc(
                    letter_head_path, letter_date_str, 'SRLDC',  pdf_headers1,
                    data_rows ,'_' ,'_' ,'SRLDC'
                )
                
                send_mail_func(pdf_path, emails ,'SRLDC')
            else :
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
                            extractdb_errormsg(f"Error parsing email list for {link}: {str(e)}")
                            continue

                    # Flatten unique emails . srldcscadaot mail for some days whether mails are going or not
                    emails = list({email for sublist in parsed_lists for email in sublist}) + ['srldcscada@grid-india.in']
                    # emails = ['uday.santhosh@grid-india.in' ]  
                    # Generate PDF
                    pdf_path = generatePDFFunc(
                        letter_head_path, letter_date_str, link,  pdf_headers,
                        data_rows, protocol, responsibility ,'Others'
                    )
                    send_mail_func(pdf_path, emails,link)
                    time.sleep(3)  #wait for 3 seconds before sending next mail
                   
            return 

        except Exception as e:
            extractdb_errormsg(str(e))
            return 