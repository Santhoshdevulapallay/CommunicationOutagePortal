from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path('fileupload/', views.adminFileBulkImport),
    path('statesSCADAMonthSummary/', views.statesSCADAMonthSummary),
    path('getPointDetailsForSpecificSubstationAndSpecificMonthYear/', views.pointDetailsSpecificSubstationSummary),
    path('statesPointsStatusAndRemarks/', views.statesPointsStatusAndRemarks),
    path('scadaPointHistory/', views.scadaPointHistory),
    # dashboard
    path('stationsCompletelyNotReporting/', views.stationsCompletelyNotReporting),
    path('plotlyDataDashboards/', views.plotlyDataDashboards),
    path('remarksTimelineTableDashboard/', views.remarksTimelineTableDashboard),
    path('notReportingTableDashboard/', views.notReportingTableDashboard),
    path('notRectifiedTableDashboard/', views.notRectifiedTableDashboard),
    #States excel part
    path('stateDownloadExcel/', views.stateDownloadExcel),
    path('stateUploadExcel/', views.stateUploadExcel),
    # Admin Approval 
    path('approvePointDetails/', views.approvePointDetails),

    path('dumpOldData/', views.dumpOldData),
    path('updateRemarks/', views.updateRemarks),
    # Letters to States
    path('getStatesSystemType/', views.getStatesSystemType),
    path('generate_letter/', views.generateLetter),
    # RTU Not Reporting
    path('getRTUMasterList/', views.getRTUMasterData),
    path('getScadaPointMasterList/', views.getSCADApointsMasterData),
    path('ScadaPointsFileUpload/', views.ScadaPointsFileUpload),
    path('getLatestRTUData/', views.getLatestRTUData),
    path('previewReport/', views.previewReport),
    path('rtuMasterChange/', views.rtuMasterChange),
    path('saveRTUMasterTable/', views.saveRTUMasterTable),
    path('saveSCADAPointsMasterTable/', views.saveSCADAPointsMasterTable),
    path('saveRTUNotReporting/', views.saveRTUNotReporting),
    path('sendRTUReportMail/', views.sendRTUReportMail),
    path('downloadRTUTemplate/', views.downloadRTUTemplate),
    path('uploadRTUMaster/', views.uploadRTUMaster),
    path('newRTUCreate/', views.newRTUCreate),
    path('downloadRTULog/', views.downloadLoggerFile),
    # Intra state req urls
    path('intraStateReq/', views.intraStateForm),
    path('getIntraStateReq/', views.getIntraStateReq),
    path('getSubstationsList/', views.getSubstationsList),
    path('downloadIntraStateUploads/', views.downloadIntraStateUploads),
    # Digital Point Details Summary
    path('digitalPointDetailsSummary/', views.digitalPointDetailsSummary),
    path('updateDigitalPoint/', views.updateDigitalPoint),
]

# urlpatterns+= static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)