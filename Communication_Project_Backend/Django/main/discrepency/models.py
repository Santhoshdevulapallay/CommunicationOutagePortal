from django.db import models
from .IntraState_models import *
from .Point_Models import *

class ApprovalStatusEnumTable(models.Model):
    approved_status = models.TextField(db_column='Approved_Status', primary_key=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'Approval_Status_Enum_Table'


class HistoryScadaMonthSummary(models.Model):
    monthyearid = models.TextField(db_column='MonthYearID', primary_key=True)  # Field name made lowercase. The composite primary key (MonthYearID, Substation) found, that is not supported. The first column is selected.
    month = models.SmallIntegerField(db_column='Month', blank=True, null=True)  # Field name made lowercase.
    month_name = models.TextField(db_column='Month_Name', blank=True, null=True)  # Field name made lowercase.
    year = models.SmallIntegerField(db_column='Year', blank=True, null=True)  # Field name made lowercase.
    substation = models.TextField(db_column='Substation')  # Field name made lowercase.
    completely_not_reporting_points = models.SmallIntegerField(db_column='Completely_Not_Reporting_Points', blank=True, null=True)  # Field name made lowercase.
    no_of_points = models.SmallIntegerField(db_column='No_of_Points', blank=True, null=True)  # Field name made lowercase.
    created_at = models.DateTimeField(db_column='Created_At', blank=True, null=True)  # Field name made lowercase.
    category = models.TextField(db_column='Category', blank=True, null=True)  # Field name made lowercase. This field type is a guess.
    state = models.TextField(db_column='State', blank=True, null=True)  # Field name made lowercase.
    completely_not_reporting_points_prevmonth = models.SmallIntegerField(db_column='Completely_Not_Reporting_Points_PrevMonth', blank=True, null=True)  # Field name made lowercase.
    scada_substation = models.CharField(db_column='scada_substation', blank=True, null=True)  # Field name made lowercase.
    ot_type = models.CharField(db_column='ot_type', blank=True, null=True)  # Field name made lowercase.
    remc_element_type = models.CharField(db_column='remc_element_type', blank=True, null=True)  # Field name made lowercase.
    class Meta:
        managed = False
        db_table = 'History_SCADA_Month_Summary'
        unique_together = (('monthyearid', 'substation'),)


class HistoryScadaPointSummary(models.Model):
    id = models.IntegerField(db_column= 'id' , primary_key= True)
    monthyearid = models.TextField(db_column='MonthYearID')  # Field name made lowercase.
    month = models.SmallIntegerField(db_column='Month', blank=True, null=True)  # Field name made lowercase.
    month_name = models.TextField(db_column='Month_Name', blank=True, null=True)  # Field name made lowercase.
    year = models.SmallIntegerField(db_column='Year', blank=True, null=True)  # Field name made lowercase.
    non_availability_percentage = models.SmallIntegerField(db_column='Non_Availability_Percentage', blank=True, null=True)  # Field name made lowercase.
    non_availability_percentage_prevmonth = models.SmallIntegerField(db_column='Non_Availability_Percentage_PrevMonth', blank=True, null=True)  # Field name made lowercase.
    created_at = models.DateTimeField(db_column='Created_At', blank=True, null=True)  # Field name made lowercase.
    status = models.TextField(db_column='Status', blank=True, null=True)  # Field name made lowercase.
    remarks = models.TextField(db_column='Remarks', blank=True, null=True)  # Field name made lowercase.
    timeline = models.DateTimeField(db_column='TimeLine', blank=True, null=True)  # Field name made lowercase.
    approved_status = models.TextField(db_column='Approved_Status', blank=True, null=True)  # Field name made lowercase.
    iccp_ioa = models.CharField(db_column='ICCP_IOA')  # Field name made lowercase.
   
    substation = models.CharField(db_column='Substation')  # Field name made lowercase.

    admin_remarks = models.TextField(db_column='Admin_Remarks', blank=True, null=True)
    admin_createdtime = models.DateTimeField(db_column='Admin_Createdtime', blank=True, null=True)
    master_seq_id = models.IntegerField(db_column='master_seq_id', blank=True, null=True)
    master_point_name = models.TextField(db_column='master_point_name', blank=True, null=True )
    ot_type = models.CharField(db_column='ot_type', blank=True, null=True)  # Field name made lowercase.
    remc_element_type = models.CharField(db_column='remc_element_type', blank=True, null=True)
    class Meta:
        managed = False
        db_table = 'History_SCADA_Point_Summary'


class ScadaPointNameMapping(models.Model):
    State = models.TextField(db_column='State', null=True, blank=True)
    Substation = models.TextField(db_column='Substation', null=True, blank=True)
    Substation_Name = models.TextField(db_column='Substation_Name', null=True, blank=True)
    Voltage_Level = models.SmallIntegerField(db_column='Voltage_Level', null=True, blank=True)
    ELEMENT_DESCRIPTION = models.TextField(db_column='ELEMENT_DESCRIPTION', null=True, blank=True)
    ELEMENT_CATEGORY = models.TextField(db_column='ELEMENT_CATEGORY', null=True, blank=True)
    Metric_Type = models.TextField(db_column='Metric_Type', null=True, blank=True)
    Point_Name = models.TextField(db_column='Point_Name')  # NOT NULL
    IOA = models.SmallIntegerField(db_column='IOA', null=True, blank=True)
    ICCP_Name = models.TextField(db_column='ICCP_Name', null=True, blank=True)
    Part_Of_Island_Scheme = models.TextField(db_column='Part_Of_Island_Scheme', null=True, blank=True)
    ot_type = models.TextField(db_column='ot_type', null=True, blank=True)
    seq_id = models.IntegerField(db_column='seq_id', primary_key=True)  # primary key

    class Meta:
        db_table = 'SCADA_Point_Name_Mapping'
        unique_together = (('seq_id', 'Point_Name'),)  # Enforce composite uniqueness

    def __str__(self):
        return f"{self.Point_Name} ({self.seq_id})"


class ScadaPointNameMappingHistory(models.Model):
    State = models.TextField(db_column='"State"', null=True, blank=True)
    Substation = models.TextField(db_column='"Substation"', null=True, blank=True)
    Substation_Name = models.TextField(db_column='"Substation_Name"', null=True, blank=True)
    Voltage_Level = models.SmallIntegerField(db_column='"Voltage_Level"', null=True, blank=True)
    ELEMENT_DESCRIPTION = models.TextField(db_column='"ELEMENT_DESCRIPTION"', null=True, blank=True)
    ELEMENT_CATEGORY = models.TextField(db_column='"ELEMENT_CATEGORY"', null=True, blank=True)
    Metric_Type = models.TextField(db_column='"Metric_Type"', null=True, blank=True)
    Point_Name = models.TextField(db_column='"Point_Name"')  # NOT NULL
    IOA = models.SmallIntegerField(db_column='"IOA"', null=True, blank=True)
    ICCP_Name = models.TextField(db_column='"ICCP_Name"', null=True, blank=True)
    Part_Of_Island_Scheme = models.TextField(db_column='"Part_Of_Island_Scheme"', null=True, blank=True)
    ot_type = models.TextField(db_column='"ot_type"', null=True, blank=True)
    seq_id = models.IntegerField(db_column='"seq_id"', primary_key=True)  # primary key
    remc_element_type = models.TextField(db_column='"remc_element_type"', null=True, blank=True)


    class Meta:
        db_table = '"staging"."SCADA_Point_Name_Mapping"'
        unique_together = (('seq_id', 'Point_Name'),)  # Enforce composite uniqueness

    def __str__(self):
        return f"{self.Point_Name} ({self.seq_id})"


class ScadaPointNameRequestsAndApprovalHistory(models.Model):
    requestid = models.BigAutoField(db_column='RequestId', primary_key=True)  # Field name made lowercase.
    userid = models.TextField(db_column='UserId', blank=True, null=True)  # Field name made lowercase.
    monthyearid = models.TextField(db_column='MonthYearID', blank=True, null=True)  # Field name made lowercase.
    point_name = models.TextField(db_column='Point_Name', blank=True, null=True)  # Field name made lowercase.
    master_seq_id = models.IntegerField(db_column='master_seq_id', blank=True, null=True)
    remarks = models.TextField(db_column='Remarks', blank=True, null=True)  # Field name made lowercase.
    userrequestcreatedat = models.DateTimeField(db_column='UserRequestCreatedAt', blank=True, null=True)  # Field name made lowercase.
    approved_remarks = models.TextField(db_column='Approved_Remarks', blank=True, null=True)  # Field name made lowercase.
    approvalcreatedat = models.DateTimeField(db_column='ApprovalCreatedAt', blank=True, null=True)  # Field name made lowercase.
    timeline = models.DateTimeField(db_column='TimeLine', blank=True, null=True)  # Field name made lowercase.
    status = models.TextField(db_column='Status', blank=True, null=True)  # Field name made lowercase.
    approved_status = models.TextField(db_column='Approved_Status', blank=True, null=True)  # Field name made lowercase.

    admin_remarks = models.TextField(db_column='Admin_Remarks', blank=True, null=True)
    admin_createdtime = models.DateTimeField(db_column='Admin_Createdtime', blank=True, null=True)
    category = models.TextField(db_column='Category', blank=True, null=True)
    class Meta:
        managed = False
        db_table = 'SCADA_Point_Name_Requests_And_Approval_History'


class StateEnumTable(models.Model):
    state = models.TextField(db_column='State', primary_key=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'State_Enum_Table'


class StatusEnumTable(models.Model):
    status = models.TextField(db_column='Status', primary_key=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'Status_Enum_Table'

class EntityAddress(models.Model):
    entity_name = models.CharField(max_length=50 , default=None)
    address = models.TextField(default=None , blank=True , null= True)

    class Meta:
        managed = True
        db_table = 'entity_address'


class ScadaTelemetryReport(models.Model):
    link = models.CharField(max_length=255, blank=True, null=True)
    channel_type = models.CharField(max_length=10, blank=True, null=True)
    mainChannel = models.CharField(max_length=200, blank=True, null=True)
    mainOutageTime = models.DateTimeField(max_length=200, blank=True, null=True)
    mainChannelStatus = models.CharField(max_length=255, blank=True, null=True)
    standByChannel = models.CharField(max_length=200, blank=True, null=True)
    standByOutageTime = models.DateTimeField(max_length=200, blank=True, null=True)
    standByChannelStatus = models.CharField(max_length=255, blank=True, null=True)
    mainactionNeeded = models.CharField(max_length=500, blank=True, null=True)
    standbyactionNeeded = models.CharField(max_length=500, blank=True, null=True)
    createdDate = models.DateField(auto_now_add=True, blank=True, null=True)
    mail_sent = models.BooleanField(default=False , blank=True, null=True)

    def __str__(self):
        return self.link
    
    class Meta:
        managed = True
        db_table = 'scada_telemetry_report'

class RTUMaster(models.Model):
    link = models.CharField(max_length=255, default=None)
    protocol = models.CharField(max_length=20 , default=None)
    responsibility = models.CharField(max_length=255, default=None)
    linkMailList = models.TextField(default=None, blank=True, null=True)
    mcc_m = models.CharField(max_length=20, blank=True, null=True) # Main Chaneel - Main
    mcc_s = models.CharField(max_length=20, blank=True, null=True) # Main Chaneel - Standby
    bcc_m = models.CharField(max_length=20, blank=True, null=True) # Backup Chaneel - Main
    bcc_s = models.CharField(max_length=20, blank=True, null=True) # Backup Chaneel - Standby
    rtu_type = models.CharField(max_length=10, default=None , blank=True, null=True) # RTU Type

    def __str__(self):
        return self.link
    
    class Meta:
        managed = True
        db_table = 'rtu_master'

class RTUReportMessageCount(models.Model):
    message_no = models.IntegerField(default=None)
    month = models.CharField(max_length=10, blank=True, null=True)
    year = models.IntegerField(default=None)
    
    def __str__(self):
        return self.message_no
    
    class Meta:
        managed = True
        db_table = 'rtu_message_count'
        unique_together = ('month', 'year', 'message_no')

class SubstationList(models.Model):
    substation_name = models.CharField(max_length=255, default=None)
    voltage_level = models.IntegerField(default=None)

    def __str__(self):
        return self.substation_name
    
    class Meta:
        managed = True
        db_table = 'substation_list'
        unique_together = ('substation_name','voltage_level')  # Ensure unique combinations