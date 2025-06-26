#!/bin/sh
set -e

# PostgreSQL이 준비될 때까지 대기
echo "Waiting for PostgreSQL..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "PostgreSQL started"

# Redis가 준비될 때까지 대기
echo "Waiting for Redis..."
while ! nc -z redis 6379; do
  sleep 0.1
done
echo "Redis started"

# 명령 실행
exec "$@"
