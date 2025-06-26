import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Button,
  IconButton,
} from '@mui/material';
// Grid2는 MUI v7에서 사용 불가, Box로 대체
import {
  MusicNote,
  PlayArrow,
  Pause,
  SkipNext,
  SkipPrevious,
  Favorite,
  FavoriteBorder,
} from '@mui/icons-material';

// 스크롤바 스타일 데모 컴포넌트
const ScrollbarStylesDemo: React.FC = () => {
  const [likedItems, setLikedItems] = useState<number[]>([]);

  const toggleLike = (id: number) => {
    setLikedItems(prev =>
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // 데모 데이터
  const musicItems = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    title: `Track ${i + 1}`,
    artist: `Artist ${(i % 5) + 1}`,
    duration: `${Math.floor(Math.random() * 4) + 2}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    genre: ['Pop', 'Rock', 'Jazz', 'Electronic', 'Classical'][i % 5],
  }));

  const playlistItems = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    name: `Playlist ${i + 1}`,
    tracks: Math.floor(Math.random() * 50) + 10,
    duration: `${Math.floor(Math.random() * 3) + 1}h ${Math.floor(Math.random() * 60)}m`,
  }));

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        스크롤바 스타일 데모
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* 기본 스크롤바 */}
        <Box>
          <Card>
            <CardHeader 
              title="기본 스크롤바"
              subheader="전역 스타일이 적용된 기본 스크롤바"
            />
            <CardContent>
              <Box 
                sx={{ 
                  height: 300, 
                  overflow: 'auto',
                  p: 2,
                  bgcolor: 'background.default',
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" paragraph>
                  이것은 기본 전역 스크롤바 스타일이 적용된 컨테이너입니다.
                </Typography>
                {Array.from({ length: 20 }, (_, i) => (
                  <Typography key={i} variant="body2" paragraph>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                    Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. {i + 1}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* 음악 페이지 스타일 스크롤바 */}
        <Box>
          <Card>
            <CardHeader 
              title="음악 페이지 스크롤바"
              subheader="음악 페이지 전용 스타일"
            />
            <CardContent>
              <Box 
                className="music-page-scrollbar"
                sx={{ 
                  height: 300, 
                  overflow: 'auto',
                  p: 2,
                  bgcolor: 'background.default',
                  borderRadius: 1,
                }}
              >
                <List>
                  {musicItems.slice(0, 10).map((item) => (
                    <ListItem 
                      key={item.id}
                      secondaryAction={
                        <IconButton onClick={() => toggleLike(item.id)}>
                          {likedItems.includes(item.id) ? (
                            <Favorite color="error" />
                          ) : (
                            <FavoriteBorder />
                          )}
                        </IconButton>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <MusicNote />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={item.title}
                        secondary={`${item.artist} • ${item.duration}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* 플레이리스트 스크롤바 */}
        <Box>
          <Card>
            <CardHeader 
              title="플레이리스트 스크롤바"
              subheader="얇고 세련된 스타일"
            />
            <CardContent>
              <Box 
                className="playlist-scrollbar"
                sx={{ 
                  height: 250, 
                  overflow: 'auto',
                  p: 2,
                  bgcolor: 'background.default',
                  borderRadius: 1,
                }}
              >
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
                  {playlistItems.map((playlist) => (
                    <Box key={playlist.id}>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 2, 
                          cursor: 'pointer',
                          '&:hover': { 
                            bgcolor: 'action.hover',
                            transform: 'translateY(-2px)',
                            transition: 'all 0.2s',
                          }
                        }}
                      >
                        <Typography variant="subtitle1" fontWeight={600}>
                          {playlist.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {playlist.tracks} tracks • {playlist.duration}
                        </Typography>
                      </Paper>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* 그라디언트 스크롤바 */}
        <Box>
          <Card>
            <CardHeader 
              title="그라디언트 스크롤바"
              subheader="화려한 그라디언트 효과"
            />
            <CardContent>
              <Box 
                className="gradient-scrollbar"
                sx={{ 
                  height: 250, 
                  overflow: 'auto',
                  p: 2,
                  bgcolor: 'background.default',
                  borderRadius: 1,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  장르별 음악
                </Typography>
                {['Pop', 'Rock', 'Jazz', 'Electronic', 'Classical', 'Hip Hop', 'R&B', 'Country'].map((genre) => (
                  <Box key={genre} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      {genre}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Chip 
                          key={i} 
                          label={`${genre} Track ${i + 1}`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* 애니메이션 스크롤바 */}
        <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
          <Card>
            <CardHeader 
              title="애니메이션 스크롤바"
              subheader="스크롤할 때 애니메이션 효과"
            />
            <CardContent>
              <Box 
                className="animated-scrollbar smooth-scroll"
                sx={{ 
                  height: 200, 
                  overflow: 'auto',
                  p: 2,
                  bgcolor: 'background.default',
                  borderRadius: 1,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  음악 플레이어 컨트롤
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <IconButton><SkipPrevious /></IconButton>
                  <IconButton sx={{ bgcolor: 'primary.main', color: 'white' }}>
                    <PlayArrow />
                  </IconButton>
                  <IconButton><SkipNext /></IconButton>
                </Box>
                {musicItems.map((item) => (
                  <Box 
                    key={item.id} 
                    sx={{ 
                      p: 1.5, 
                      mb: 1, 
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box>
                      <Typography variant="body1">{item.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.artist} • {item.genre}
                      </Typography>
                    </Box>
                    <Typography variant="caption">{item.duration}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* 사용 가능한 클래스 설명 */}
        <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
          <Card>
            <CardHeader title="사용 가능한 스크롤바 클래스" />
            <CardContent>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    기본 클래스
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary=".custom-scrollbar"
                        secondary="커스텀 컬러 스크롤바"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary=".minimal-scrollbar"
                        secondary="미니멀한 얇은 스크롤바"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary=".music-scrollbar"
                        secondary="음악 페이지 스타일"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary=".hide-scrollbar"
                        secondary="스크롤바 숨기기"
                      />
                    </ListItem>
                  </List>
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    특수 효과 클래스
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary=".animated-scrollbar"
                        secondary="애니메이션 효과"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary=".hover-scrollbar"
                        secondary="호버시에만 표시"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary=".gradient-scrollbar"
                        secondary="그라디언트 효과"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary=".smooth-scroll"
                        secondary="부드러운 스크롤"
                      />
                    </ListItem>
                  </List>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default ScrollbarStylesDemo;
