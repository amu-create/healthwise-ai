import React, { useEffect, useState } from 'react';
import { Box, Typography, Alert, Paper, Button } from '@mui/material';

const KakaoMapDebug = () => {
  const [status, setStatus] = useState({
    kakaoLoaded: false,
    kakaoMapsLoaded: false,
    error: null,
    apiKey: null,
    debugInfo: []
  });

  useEffect(() => {
    const checkKakaoStatus = () => {
      const debugInfo = [];
      
      // 1. window.kakao 체크
      if (window.kakao) {
        debugInfo.push('✅ window.kakao 존재');
        
        // 2. window.kakao.maps 체크
        if (window.kakao.maps) {
          debugInfo.push('✅ window.kakao.maps 존재');
          
          // 3. 주요 클래스 체크
          const classes = ['Map', 'LatLng', 'Marker', 'InfoWindow'];
          classes.forEach(className => {
            if (window.kakao.maps[className]) {
              debugInfo.push(`✅ kakao.maps.${className} 사용 가능`);
            } else {
              debugInfo.push(`❌ kakao.maps.${className} 없음`);
            }
          });
        } else {
          debugInfo.push('❌ window.kakao.maps 없음');
        }
      } else {
        debugInfo.push('❌ window.kakao 없음');
      }

      // 4. API 키 체크
      const metaTag = document.querySelector('meta[name="kakao-map-api-key"]');
      if (metaTag) {
        const apiKey = metaTag.getAttribute('content');
        debugInfo.push(`📍 API 키: ${apiKey ? apiKey.substring(0, 10) + '...' : '없음'}`);
      } else {
        debugInfo.push('❌ API 키 메타 태그 없음');
      }

      // 5. 스크립트 태그 체크
      const scripts = Array.from(document.querySelectorAll('script'));
      const kakaoScript = scripts.find(s => s.src && s.src.includes('dapi.kakao.com'));
      if (kakaoScript) {
        debugInfo.push(`📍 카카오 스크립트 URL: ${kakaoScript.src}`);
        debugInfo.push(`📍 스크립트 로드 상태: ${kakaoScript.readyState || 'loaded'}`);
      } else {
        debugInfo.push('❌ 카카오 스크립트 태그를 찾을 수 없음');
      }

      setStatus({
        kakaoLoaded: !!window.kakao,
        kakaoMapsLoaded: !!(window.kakao && window.kakao.maps),
        error: null,
        apiKey: metaTag ? metaTag.getAttribute('content') : null,
        debugInfo
      });
    };

    // 초기 체크
    checkKakaoStatus();

    // 주기적 체크 (3초 동안)
    const interval = setInterval(checkKakaoStatus, 500);
    setTimeout(() => clearInterval(interval), 3000);

    return () => clearInterval(interval);
  }, []);

  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        카카오 지도 API 디버그 정보
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          로드 상태
        </Typography>
        <Alert severity={status.kakaoMapsLoaded ? 'success' : 'error'}>
          {status.kakaoMapsLoaded 
            ? '카카오 지도 API가 정상적으로 로드되었습니다.' 
            : '카카오 지도 API가 로드되지 않았습니다.'}
        </Alert>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          디버그 정보
        </Typography>
        {status.debugInfo.map((info, index) => (
          <Typography 
            key={index} 
            variant="body2" 
            sx={{ 
              fontFamily: 'monospace',
              mb: 0.5,
              color: info.startsWith('✅') ? 'success.main' : 
                     info.startsWith('❌') ? 'error.main' : 'text.secondary'
            }}
          >
            {info}
          </Typography>
        ))}
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          해결 방법
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          1. 브라우저 개발자 도구(F12)를 열고 Console 탭을 확인하세요.
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          2. 네트워크 탭에서 카카오 API 스크립트가 정상적으로 로드되는지 확인하세요.
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          3. API 키가 올바른지, 카카오 개발자 사이트에서 등록된 도메인이 맞는지 확인하세요.
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          4. localhost:3000이 허용된 도메인 목록에 있는지 확인하세요.
        </Typography>
        <Button variant="contained" onClick={reloadPage}>
          페이지 새로고침
        </Button>
      </Paper>

      {status.kakaoMapsLoaded && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            간단한 지도 테스트
          </Typography>
          <Box 
            id="test-map" 
            sx={{ 
              width: '100%', 
              height: '400px', 
              border: '1px solid #ccc',
              borderRadius: 1
            }}
          />
        </Paper>
      )}
    </Box>
  );
};

export default KakaoMapDebug;
