cd client
call npm install
call npm run build
RMDIR /s /q ..\server\public
mkdir ..\server\public
cd dist
xcopy /s /e * ..\..\server\public\
del ..\..\server\public\js\*.map

cd ..\..\server
call npm install
call npm run compile
