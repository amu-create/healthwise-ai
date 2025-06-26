import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

interface TestResult {
  test: string;
  success: boolean;
  status?: number;
  headers?: Record<string, string>;
  error?: string;
  width?: number;
  height?: number;
  responseHeaders?: string;
}

interface ImageDebuggerProps {
  imageUrl?: string;
}

const ImageDebugger: React.FC<ImageDebuggerProps> = ({ imageUrl }) => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testImageUrl, setTestImageUrl] = useState(
    imageUrl || 'http://localhost:8000/media/profile_images/profile_3_43fc94ecdbad46b28bc82fbd48ec8b85.jpg'
  );
  
  useEffect(() => {
    if (imageUrl) {
      setTestImageUrl(imageUrl);
    }
  }, [imageUrl]);
  
  useEffect(() => {
    runTests();
  }, [testImageUrl]);
  
  const runTests = async () => {
    const results: TestResult[] = [];
    
    // Test 1: Direct fetch
    try {
      const response = await fetch(testImageUrl);
      results.push({
        test: 'Direct Fetch',
        success: response.ok,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      });
    } catch (error) {
      results.push({
        test: 'Direct Fetch',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    
    // Test 2: Image object
    const img = new Image();
    img.onload = () => {
      results.push({
        test: 'Image Object Load',
        success: true,
        width: img.width,
        height: img.height,
      });
      setTestResults([...results]);
    };
    img.onerror = (e) => {
      results.push({
        test: 'Image Object Load',
        success: false,
        error: 'Failed to load',
      });
      setTestResults([...results]);
    };
    img.src = testImageUrl;
    
    // Test 3: XMLHttpRequest
    const xhr = new XMLHttpRequest();
    xhr.open('GET', testImageUrl);
    xhr.onload = () => {
      results.push({
        test: 'XMLHttpRequest',
        success: xhr.status === 200,
        status: xhr.status,
        responseHeaders: xhr.getAllResponseHeaders(),
      });
      setTestResults([...results]);
    };
    xhr.onerror = () => {
      results.push({
        test: 'XMLHttpRequest',
        success: false,
        error: 'Network error',
      });
      setTestResults([...results]);
    };
    xhr.send();
    
    setTestResults(results);
  };
  
  const testAllUrlVariations = async () => {
    const baseImagePath = '/media/profile_images/profile_3_43fc94ecdbad46b28bc82fbd48ec8b85.jpg';
    const variations = [
      `http://localhost:8000${baseImagePath}`,
      `http://127.0.0.1:8000${baseImagePath}`,
      `http://${window.location.hostname}:8000${baseImagePath}`,
      `${window.location.origin.replace(':3000', ':8000')}${baseImagePath}`,
      baseImagePath, // 상대 경로
    ];
    
    const results: TestResult[] = [];
    
    for (const url of variations) {
      try {
        const response = await fetch(url);
        results.push({
          test: `URL Test: ${url}`,
          success: response.ok,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
        });
      } catch (error) {
        results.push({
          test: `URL Test: ${url}`,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    setTestResults(results);
  };

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Image Loading Debug Tool
      </Typography>
      
      <Button onClick={testAllUrlVariations} variant="outlined" sx={{ mb: 2 }}>
        Test All URL Variations
      </Button>
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="body2" gutterBottom>
          Test URL: {testImageUrl}
        </Typography>
        
        <Box mt={2}>
          <Typography variant="h6">Direct Image Test:</Typography>
          <img 
            src={testImageUrl} 
            alt="Test" 
            style={{ maxWidth: 200, border: '1px solid #ccc' }}
            onError={(e) => console.error('Direct img tag error:', e)}
            onLoad={() => console.log('Direct img tag loaded successfully')}
          />
        </Box>
      </Paper>
      
      <Typography variant="h6" gutterBottom>
        Test Results:
      </Typography>
      
      {testResults.map((result, index) => (
        <Paper key={index} sx={{ p: 2, mb: 1 }}>
          <Typography variant="subtitle1" color={result.success ? 'success.main' : 'error.main'}>
            {result.test}: {result.success ? 'SUCCESS' : 'FAILED'}
          </Typography>
          <pre style={{ fontSize: '0.8rem', overflow: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </Paper>
      ))}
      
      <Button onClick={runTests} variant="contained" sx={{ mt: 2 }}>
        Re-run Tests
      </Button>
    </Box>
  );
};

export default ImageDebugger;
