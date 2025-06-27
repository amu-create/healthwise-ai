import React from 'react';
import {
  Box,
  Paper,
  Typography,
  useTheme
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { Exercise } from '../../services/pose-analysis/exercises';

interface AnalysisChartProps {
  frames: any[];
  exercise: Exercise;
}

const AnalysisChart: React.FC<AnalysisChartProps> = ({ frames, exercise }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  // 시간별 점수 데이터 준비
  const timeSeriesData = frames.map((frame, idx) => ({
    time: frame.timestamp.toFixed(1),
    score: frame.overallScore,
    index: idx
  }));

  // 관절별 평균 점수 계산
  const jointScores: Record<string, number[]> = {};
  frames.forEach(frame => {
    Object.entries(frame.scores).forEach(([joint, score]) => {
      if (!jointScores[joint]) jointScores[joint] = [];
      jointScores[joint].push(score as number);
    });
  });

  const jointAverages = Object.entries(jointScores).map(([joint, scores]) => ({
    joint: translateJointName(joint),
    score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  }));

  // 레이더 차트 데이터
  const radarData = jointAverages.map(item => ({
    joint: item.joint,
    score: item.score,
    fullMark: 100
  }));

  // 구간별 점수 분포
  const scoreDistribution = {
    excellent: frames.filter(f => f.overallScore >= 90).length,
    good: frames.filter(f => f.overallScore >= 70 && f.overallScore < 90).length,
    needsImprovement: frames.filter(f => f.overallScore < 70).length
  };

  const distributionData = [
    { name: t('pose_analysis.excellent'), value: scoreDistribution.excellent, color: theme.palette.success.main },
    { name: t('pose_analysis.good'), value: scoreDistribution.good, color: theme.palette.warning.main },
    { name: t('pose_analysis.needs_improvement'), value: scoreDistribution.needsImprovement, color: theme.palette.error.main }
  ];

  function translateJointName(joint: string): string {
    const translations: Record<string, string> = {
      knee: '무릎',
      hip: '엉덩이',
      elbow: '팔꿈치',
      shoulder: '어깨',
      ankle: '발목',
      wrist: '손목',
      back: '허리',
      neck: '목',
      frontKnee: '앞 무릎',
      backKnee: '뒤 무릎'
    };
    return translations[joint] || joint;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* 시간별 점수 추이 */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('pose_analysis.score_over_time')}
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" label={{ value: t('pose_analysis.time_seconds'), position: 'insideBottom', offset: -5 }} />
            <YAxis domain={[0, 100]} label={{ value: t('pose_analysis.score'), angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="score"
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              dot={false}
              name={t('pose_analysis.overall_score')}
            />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      {/* 관절별 평균 점수 */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('pose_analysis.joint_scores')}
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={jointAverages}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="joint" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar
              dataKey="score"
              fill={theme.palette.primary.main}
              name={t('pose_analysis.average_score')}
            />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* 레이더 차트 */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('pose_analysis.performance_radar')}
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="joint" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            <Radar
              name={t('pose_analysis.score')}
              dataKey="score"
              stroke={theme.palette.primary.main}
              fill={theme.palette.primary.main}
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </Paper>

      {/* 점수 분포 */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('pose_analysis.score_distribution')}
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={distributionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar 
              dataKey="value" 
              name={t('pose_analysis.frames')}
            >
              {distributionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
};

export default AnalysisChart;
