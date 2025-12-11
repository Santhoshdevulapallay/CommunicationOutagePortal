setlocal

rem Get the directory of the batch file
set "batchdir=%~dp0"

rem Change to the batch file directory
cd /d "%batchdir%"

rem Activate the virtual environment
call .\Scripts\activate

rem Execute the Python script
python uploadTelemetryMonthlyDataToPostgres.py %*

rem Deactivate the virtual environment
deactivate

endlocal