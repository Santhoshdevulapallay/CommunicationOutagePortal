
from django.db import models


class IntraStateRequests(models.Model):
    utility = models.CharField(max_length=255, default=None)
    type_of_request = models.CharField(max_length=20 , default=None)
    end_a_substation = models.CharField(max_length=255, default=None)
    util_sld = models.CharField(max_length=255, blank=True, null=True) 
    util_subtop = models.CharField(max_length=255, blank=True, null=True) 
    remarks = models.TextField(default= None , blank=True, null=True)
    util_oag = models.CharField(max_length=255, blank=True, null=True) 
    class Meta:
        db_table = 'IntraState_Requests'

    def __str__(self):
        return self.utility

class IntraStateElements(models.Model):
    element_fk = models.ForeignKey(IntraStateRequests, on_delete=models.SET_NULL , null=True)
    element_type = models.CharField(max_length=50, default=None)
    element_no = models.IntegerField(default=None)
    no_of_bays = models.IntegerField(default=None)
    name_of_element = models.CharField(max_length=255 , default=None)
    date_of_charging = models.DateField(default=None)
    end_b_substation = models.CharField(max_length=255, default=None)
    element_sld = models.CharField(max_length=255, blank=True, null=True) 
    element_subtop = models.CharField(max_length=255, blank=True, null=True) 
    
    class Meta:
        db_table = 'IntraState_Elements'

    def __str__(self):
        return self.element_fk