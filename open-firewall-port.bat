@echo off
echo Opening Windows Firewall port 4001 for HTTPS...
netsh advfirewall firewall add rule name="Node HTTPS Server Port 4001" dir=in action=allow protocol=TCP localport=4001
echo.
echo Firewall rule added!
echo.
echo To verify, run: netsh advfirewall firewall show rule name="Node HTTPS Server Port 4001"
pause

