import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Container,
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Badge,
} from '@mui/material';
import {
  RssFeed,
  Message,
  Notifications,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import SocialFeed from './SocialFeed';
import DirectMessages from '../components/DirectMessages';
import NotificationList from '../components/NotificationList';
import api from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`social-tabpanel-${index}`}
      aria-labelledby={`social-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export default function Social() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tabValue, setTabValue] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // URL 파라미터에서 탭 상태 읽기
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'messages') {
      setTabValue(1);
    } else if (tab === 'notifications') {
      setTabValue(2);
    } else {
      setTabValue(0);
    }
  }, [searchParams]);

  // 읽지 않은 메시지/알림 수 가져오기
  useEffect(() => {
    if (user) {
      fetchUnreadCounts();
      // 30초마다 업데이트
      const interval = setInterval(fetchUnreadCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCounts = async () => {
    try {
      // 읽지 않은 메시지 수
      const messagesResponse = await api.get('/social/conversations/unread_count/');
      setUnreadMessages(messagesResponse.data.unread_count || 0);

      // 읽지 않은 알림 수
      const notificationsResponse = await api.get('/social/notifications/unread_count/');
      setUnreadNotifications(notificationsResponse.data.unread_count || 0);
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // URL 파라미터 업데이트
    if (newValue === 0) {
      searchParams.delete('tab');
    } else if (newValue === 1) {
      searchParams.set('tab', 'messages');
    } else if (newValue === 2) {
      searchParams.set('tab', 'notifications');
    }
    setSearchParams(searchParams);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={900}>
          {t('navigation.social')}
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            icon={<RssFeed />}
            label={t('social.feed')}
            iconPosition="start"
          />
          <Tab
            icon={
              <Badge badgeContent={unreadMessages} color="error">
                <Message />
              </Badge>
            }
            label={t('social.messages')}
            iconPosition="start"
          />
          <Tab
            icon={
              <Badge badgeContent={unreadNotifications} color="error">
                <Notifications />
              </Badge>
            }
            label={t('social.notifications')}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <SocialFeed />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <DirectMessages />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <NotificationList onUpdate={fetchUnreadCounts} />
      </TabPanel>
    </Container>
  );
}
