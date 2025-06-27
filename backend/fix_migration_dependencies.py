#!/usr/bin/env python
"""
마이그레이션 의존성 문제 해결 스크립트
social 앱이 workout 앱에 의존하는 순환 참조 문제를 해결합니다.
"""

import os
import sys
import django

# Django 설정
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'healthwise.settings')
django.setup()

from django.db import connection
from django.core.management import call_command

def reset_migrations():
    """모든 마이그레이션을 초기화합니다."""
    print("마이그레이션 초기화 시작...")
    
    # 1. 마이그레이션 기록 삭제
    with connection.cursor() as cursor:
        # django_migrations 테이블이 존재하는지 확인
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'django_migrations'
            );
        """)
        exists = cursor.fetchone()[0]
        
        if exists:
            print("기존 마이그레이션 기록 삭제 중...")
            cursor.execute("DELETE FROM django_migrations WHERE app IN ('core', 'workout', 'social', 'achievements', 'api', 'pose_analysis');")
            print(f"삭제된 마이그레이션 기록: {cursor.rowcount}개")
    
    # 2. 마이그레이션 파일 삭제
    apps = ['core', 'workout', 'social', 'achievements', 'api', 'pose_analysis']
    for app in apps:
        migrations_dir = f'apps/{app}/migrations'
        if os.path.exists(migrations_dir):
            for file in os.listdir(migrations_dir):
                if file.endswith('.py') and file != '__init__.py':
                    os.remove(os.path.join(migrations_dir, file))
                    print(f"삭제: {app}/migrations/{file}")
    
    print("마이그레이션 초기화 완료!")

def create_migrations_in_order():
    """올바른 순서로 마이그레이션을 생성합니다."""
    print("\n마이그레이션 재생성 시작...")
    
    # 순서가 중요합니다!
    apps_order = [
        'core',      # User 모델이 있는 앱 (다른 앱들이 참조)
        'workout',   # 독립적인 앱
        'api',       # workout을 참조할 수 있음
        'social',    # workout과 api를 참조
        'achievements',  # 다른 앱들을 참조
        'pose_analysis', # 독립적인 앱
    ]
    
    for app in apps_order:
        print(f"\n{app} 앱 마이그레이션 생성 중...")
        try:
            call_command('makemigrations', app, verbosity=0)
            print(f"✓ {app} 마이그레이션 생성 완료")
        except Exception as e:
            print(f"✗ {app} 마이그레이션 생성 실패: {e}")

def apply_migrations():
    """마이그레이션을 적용합니다."""
    print("\n마이그레이션 적용 시작...")
    
    try:
        call_command('migrate', verbosity=1)
        print("✓ 모든 마이그레이션 적용 완료!")
    except Exception as e:
        print(f"✗ 마이그레이션 적용 실패: {e}")
        return False
    
    return True

def main():
    """메인 실행 함수"""
    print("="*50)
    print("HealthWise AI 마이그레이션 의존성 문제 해결")
    print("="*50)
    
    # 확인 메시지
    confirm = input("\n⚠️  경고: 이 작업은 모든 마이그레이션을 초기화합니다.\n계속하시겠습니까? (yes/no): ")
    if confirm.lower() != 'yes':
        print("취소되었습니다.")
        return
    
    # 1. 마이그레이션 초기화
    reset_migrations()
    
    # 2. 마이그레이션 재생성
    create_migrations_in_order()
    
    # 3. 마이그레이션 적용
    success = apply_migrations()
    
    if success:
        print("\n✅ 마이그레이션 의존성 문제가 해결되었습니다!")
        print("이제 프로젝트를 정상적으로 실행할 수 있습니다.")
    else:
        print("\n❌ 문제가 발생했습니다. 로그를 확인해주세요.")

if __name__ == '__main__':
    main()
