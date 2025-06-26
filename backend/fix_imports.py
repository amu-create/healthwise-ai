#!/usr/bin/env python
import os
import re

def fix_imports_in_file(filepath):
    """파일의 import 문을 수정"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # import 패턴 수정
        patterns = [
            # from api import -> from apps.api import
            (r'from api import', 'from apps.api import'),
            # from api. -> from apps.api.
            (r'from api\.', 'from apps.api.'),
            # from core import -> from apps.core import
            (r'from core import', 'from apps.core import'),
            # from core. -> from apps.core.
            (r'from core\.', 'from apps.core.'),
            # from social import -> from apps.social import
            (r'from social import', 'from apps.social import'),
            # from social. -> from apps.social.
            (r'from social\.', 'from apps.social.'),
            # import api -> import apps.api
            (r'^import api$', 'import apps.api', re.MULTILINE),
            # import api. -> import apps.api.
            (r'^import api\.', 'import apps.api.', re.MULTILINE),
            # import core -> import apps.core
            (r'^import core$', 'import apps.core', re.MULTILINE),
            # import core. -> import apps.core.
            (r'^import core\.', 'import apps.core.', re.MULTILINE),
            # import social -> import apps.social
            (r'^import social$', 'import apps.social', re.MULTILINE),
            # import social. -> import apps.social.
            (r'^import social\.', 'import apps.social.', re.MULTILINE),
        ]
        
        for item in patterns:
            if len(item) == 3:  # re.MULTILINE flag가 있는 경우
                pattern, replacement, flags = item
                content = re.sub(pattern, replacement, content, flags=flags)
            else:
                pattern, replacement = item
                content = re.sub(pattern, replacement, content)
        
        # 파일이 변경된 경우에만 저장
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated: {filepath}")
            return True
        return False
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def process_directory(root_dir):
    """디렉토리 내의 모든 Python 파일을 처리"""
    updated_count = 0
    
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # __pycache__ 디렉토리 제외
        if '__pycache__' in dirpath:
            continue
            
        for filename in filenames:
            if filename.endswith('.py'):
                filepath = os.path.join(dirpath, filename)
                if fix_imports_in_file(filepath):
                    updated_count += 1
    
    return updated_count

if __name__ == "__main__":
    # apps 디렉토리 처리
    apps_dir = os.path.join(os.path.dirname(__file__), 'apps')
    print(f"Processing directory: {apps_dir}")
    
    count = process_directory(apps_dir)
    print(f"\nTotal files updated: {count}")
