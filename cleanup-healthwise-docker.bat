@echo off
echo === HealthWise Docker 정리 스크립트 ===
echo.

echo [1] HealthWise 컨테이너 중지 및 삭제...
FOR /f "tokens=*" %%i IN ('docker ps -q --filter "name=healthwise"') DO docker stop %%i
FOR /f "tokens=*" %%i IN ('docker ps -aq --filter "name=healthwise"') DO docker rm %%i

echo.
echo [2] HealthWise 이미지 삭제...
FOR /f "tokens=*" %%i IN ('docker images -q healthwise*') DO docker rmi %%i
FOR /f "tokens=*" %%i IN ('docker images -q *healthwise*') DO docker rmi %%i

echo.
echo [3] Docker 시스템 정리...
docker system prune -f

echo.
echo [4] 현재 Docker 사용 공간...
docker system df

echo.
echo === 정리 완료! ===
echo.
echo 이제 다음 명령어로 새로 시작하세요:
echo git clone https://github.com/amu-create/healthwise-ai.git
echo cd healthwise-ai
echo (env 파일 설정 후)
echo docker-compose -f docker-compose.dev.yml up --build -d
echo.
pause
