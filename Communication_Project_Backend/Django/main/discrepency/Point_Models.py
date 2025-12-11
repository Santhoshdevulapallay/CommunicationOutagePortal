
from django.db import models

class HistoryScadaMonthSummaryDigital(models.Model):
    monthyearid = models.TextField(db_column='MonthYearID', primary_key=True)  # Field name made lowercase. The composite primary key (MonthYearID, Substation) found, that is not supported. The first column is selected.
    month = models.SmallIntegerField(db_column='Month', blank=True, null=True)  # Field name made lowercase.
    month_name = models.TextField(db_column='Month_Name', blank=True, null=True)  # Field name made lowercase.
    year = models.SmallIntegerField(db_column='Year', blank=True, null=True)  # Field name made lowercase.
    substation = models.TextField(db_column='Substation_Name')  # Field name made lowercase.
    completely_not_reporting_points = models.SmallIntegerField(db_column='Completely_Not_Reporting_Points', blank=True, null=True)  # Field name made lowercase.
    no_of_points = models.SmallIntegerField(db_column='No_of_Points', blank=True, null=True)  # Field name made lowercase.
    created_at = models.DateTimeField(db_column='Created_At', blank=True, null=True)  # Field name made lowercase
    state = models.TextField(db_column='State', blank=True, null=True)  # Field name made lowercase.
    completely_not_reporting_points_prevmonth = models.SmallIntegerField(db_column='Completely_Not_Reporting_Points_PrevMonth', blank=True, null=True)  # Field name made lowercase.
    scada_substation = models.CharField(db_column='scada_substation', blank=True, null=True)  # Field name made lowercase.
    
    class Meta:
        managed = False
        db_table = 'history_scada_digital_month_summary'

class HistoryScadaDigitalIccpPointSummary(models.Model):
    id = models.BigAutoField(primary_key=True)
    MonthYearID = models.CharField(max_length=255)
    Month = models.SmallIntegerField()
    Month_Name = models.CharField(max_length=255)
    Year = models.SmallIntegerField()
    State = models.CharField(max_length=255)
    scada_substation = models.CharField(max_length=255)
    substation_name = models.CharField(max_length=255)
    master_seq_id = models.IntegerField()
    master_point_name = models.CharField(max_length=255)

    Non_Availability_Percentage = models.SmallIntegerField(null=True, blank=True)
    Non_Availability_Percentage_PrevMonth = models.SmallIntegerField(
        null=True, blank=True
    )

    remrepl = models.IntegerField(null=True, blank=True)
    non_reporting = models.IntegerField(null=True, blank=True)
    reporting_open_close = models.IntegerField(null=True, blank=True)
    reporting_between_invalid = models.IntegerField(null=True, blank=True)

    Created_At = models.DateTimeField(null=True, blank=True)

    Status = models.CharField(max_length=255, null=True, blank=True)
    Remarks = models.CharField(max_length=1000, null=True, blank=True)

    TimeLine = models.DateField(null=True, blank=True)
    Approved_Status = models.CharField(max_length=255, null=True, blank=True)
    Admin_Remarks = models.CharField(max_length=1000, null=True, blank=True)
    Admin_Createdtime = models.DateTimeField(null=True, blank=True)
    class Meta:
        managed = False
        db_table = "history_scada_digital_iccp_point_summary"

class HistoryScadaDigitalFepPointSummary(models.Model):
    id = models.BigAutoField(primary_key=True)
    MonthYearID = models.CharField(max_length=255)
    Month = models.SmallIntegerField()
    Month_Name = models.CharField(max_length=255)
    Year = models.SmallIntegerField()
    State = models.CharField(max_length=255)
    scada_substation = models.CharField(max_length=255)
    substation_name = models.CharField(max_length=255)
    master_seq_id = models.IntegerField()
    master_point_name = models.CharField(max_length=255)

    Non_Availability_Percentage = models.SmallIntegerField(null=True, blank=True)
    Non_Availability_Percentage_PrevMonth = models.SmallIntegerField(null=True, blank=True)

    telemetry_failure = models.IntegerField(null=True, blank=True)
    field_replaced_bad_quality = models.IntegerField(null=True, blank=True)
    reporting_open_close = models.IntegerField(null=True, blank=True)
    reporting_between_invalid = models.IntegerField(null=True, blank=True)
    not_reporting = models.IntegerField(null=True, blank=True)

    Created_At = models.DateTimeField(null=True, blank=True)

    Status = models.CharField(max_length=255, null=True, blank=True)
    Remarks = models.CharField(max_length=1000, null=True, blank=True)

    TimeLine = models.DateField(null=True, blank=True)
    Approved_Status = models.CharField(max_length=255, null=True, blank=True)
    Admin_Remarks = models.CharField(max_length=1000, null=True, blank=True)
    Admin_Createdtime = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        managed = False
        db_table = "history_scada_digital_fep_point_summary"