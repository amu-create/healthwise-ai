import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Alert,
} from '@mui/material';
import {
  LocalFireDepartment,
  FitnessCenter,
  Scale,
  Timeline,
  LocalDrink,
  Hotel,
  Restaurant,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface GoalType {
  id: string;
  name: string;
  icon: React.ReactElement;
  unit: string;
  inputType: 'number' | 'time';
  min: number;
  max: number;
  step: number;
  dataSource: 'ai_nutrition' | 'ai_workout' | 'manual' | 'health_check';
  presets?: { label: string; value: number }[];
  helperText?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (goal: { goal_type: string; target_value: number }) => void;
  editingGoal?: { goal_type: string; target_value: number } | null;
}

const GoalCreationDialog: React.FC<Props> = ({ open, onClose, onSubmit, editingGoal }) => {
  const { t } = useTranslation();
  
  const goalTypes: GoalType[] = [
    {
      id: 'daily_calories',
      name: t('pages.achievements.goalTypes.dailyCalories'),
      icon: <LocalFireDepartment />,
      unit: 'kcal',
      inputType: 'number',
      min: 500,
      max: 5000,
      step: 100,
      dataSource: 'ai_nutrition',
      presets: [
        { label: t('pages.achievements.presets.diet'), value: 1500 },
        { label: t('pages.achievements.presets.maintain'), value: 2000 },
        { label: t('pages.achievements.presets.bulkUp'), value: 3000 },
      ],
      helperText: t('pages.achievements.goalHelpers.dailyCalories'),
    },
    {
      id: 'weekly_workouts',
      name: t('pages.achievements.goalTypes.weeklyWorkouts'),
      icon: <FitnessCenter />,
      unit: t('common.times'),
      inputType: 'number',
      min: 1,
      max: 14,
      step: 1,
      dataSource: 'ai_workout',
      presets: [
        { label: t('pages.achievements.presets.beginner'), value: 3 },
        { label: t('pages.achievements.presets.intermediate'), value: 5 },
        { label: t('pages.achievements.presets.advanced'), value: 7 },
      ],
    },
    {
      id: 'monthly_workouts',
      name: t('pages.achievements.goalTypes.monthlyWorkouts'),
      icon: <FitnessCenter />,
      unit: t('common.times'),
      inputType: 'number',
      min: 1,
      max: 60,
      step: 1,
      dataSource: 'ai_workout',
      presets: [
        { label: t('pages.achievements.presets.beginner'), value: 12 },
        { label: t('pages.achievements.presets.intermediate'), value: 20 },
        { label: t('pages.achievements.presets.advanced'), value: 30 },
      ],
    },
    {
      id: 'weight_target',
      name: t('pages.achievements.goalTypes.weightTarget'),
      icon: <Scale />,
      unit: 'kg',
      inputType: 'number',
      min: 30,
      max: 200,
      step: 0.1,
      dataSource: 'health_check',
      helperText: t('pages.achievements.goalHelpers.weightTarget'),
    },
    {
      id: 'daily_steps',
      name: t('pages.achievements.goalTypes.dailySteps'),
      icon: <Timeline />,
      unit: t('common.steps'),
      inputType: 'number',
      min: 1000,
      max: 50000,
      step: 1000,
      dataSource: 'manual',
      presets: [
        { label: t('pages.achievements.presets.basic'), value: 5000 },
        { label: t('pages.achievements.presets.active'), value: 10000 },
        { label: t('pages.achievements.presets.veryActive'), value: 15000 },
      ],
    },
    {
      id: 'daily_water',
      name: t('pages.achievements.goalTypes.dailyWater'),
      icon: <LocalDrink />,
      unit: 'ml',
      inputType: 'number',
      min: 500,
      max: 5000,
      step: 250,
      dataSource: 'manual',
      presets: [
        { label: t('pages.achievements.presets.basic'), value: 1500 },
        { label: t('pages.achievements.presets.recommended'), value: 2000 },
        { label: t('pages.achievements.presets.exercise'), value: 3000 },
      ],
    },
    {
      id: 'sleep_hours',
      name: t('pages.achievements.goalTypes.sleepHours'),
      icon: <Hotel />,
      unit: t('common.hours'),
      inputType: 'time',
      min: 4,
      max: 12,
      step: 0.5,
      dataSource: 'manual',
      presets: [
        { label: t('pages.achievements.presets.minimum'), value: 6 },
        { label: t('pages.achievements.presets.recommended'), value: 8 },
        { label: t('pages.achievements.presets.sufficient'), value: 9 },
      ],
    },
    {
      id: 'daily_protein',
      name: t('pages.achievements.goalTypes.dailyProtein'),
      icon: <Restaurant />,
      unit: 'g',
      inputType: 'number',
      min: 10,
      max: 300,
      step: 5,
      dataSource: 'ai_nutrition',
      presets: [
        { label: t('pages.achievements.presets.general'), value: 50 },
        { label: t('pages.achievements.presets.workout'), value: 100 },
        { label: t('pages.achievements.presets.bulkUp'), value: 150 },
      ],
    },
  ];

  const [selectedType, setSelectedType] = useState(editingGoal?.goal_type || 'weekly_workouts');
  const [targetValue, setTargetValue] = useState(editingGoal?.target_value || 3);
  const [inputMode, setInputMode] = useState<'preset' | 'custom'>('preset');
  const [error, setError] = useState('');

  const currentGoalType = goalTypes.find(g => g.id === selectedType) || goalTypes[0];

  useEffect(() => {
    if (editingGoal) {
      setSelectedType(editingGoal.goal_type);
      setTargetValue(editingGoal.target_value);
      
      // Check if value matches any preset
      const hasMatchingPreset = currentGoalType.presets?.some(p => p.value === editingGoal.target_value);
      setInputMode(hasMatchingPreset ? 'preset' : 'custom');
    }
  }, [editingGoal, currentGoalType.presets]);

  const handleTypeChange = (newType: string) => {
    setSelectedType(newType);
    const newGoalType = goalTypes.find(g => g.id === newType);
    if (newGoalType) {
      // Set default value
      if (newGoalType.presets && newGoalType.presets.length > 0) {
        setTargetValue(newGoalType.presets[0].value);
        setInputMode('preset');
      } else {
        setTargetValue(newGoalType.min);
        setInputMode('custom');
      }
    }
    setError('');
  };

  const handlePresetChange = (_: React.MouseEvent<HTMLElement>, newValue: string | null) => {
    if (newValue) {
      setTargetValue(Number(newValue));
    }
  };

  const handleCustomValueChange = (value: string) => {
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      setTargetValue(numValue);
    }
  };

  const handleSubmit = () => {
    if (targetValue < currentGoalType.min || targetValue > currentGoalType.max) {
      setError(t('pages.achievements.errors.invalidValue', { 
        min: currentGoalType.min, 
        max: currentGoalType.max 
      }));
      return;
    }

    onSubmit({
      goal_type: selectedType,
      target_value: targetValue,
    });
  };

  const getDataSourceBadge = (source: string) => {
    const badges = {
      ai_nutrition: { label: t('pages.achievements.dataSourceBadges.aiNutrition'), color: 'primary' },
      ai_workout: { label: t('pages.achievements.dataSourceBadges.aiWorkout'), color: 'secondary' },
      health_check: { label: t('pages.achievements.dataSourceBadges.healthCheck'), color: 'success' },
      manual: { label: t('pages.achievements.dataSourceBadges.manual'), color: 'default' },
    };
    
    const badge = badges[source as keyof typeof badges];
    return badge ? (
      <Chip
        label={badge.label}
        color={badge.color as any}
        size="small"
        sx={{ ml: 1 }}
      />
    ) : null;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editingGoal ? t('pages.achievements.editGoal') : t('pages.achievements.addGoal')}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {!editingGoal && (
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>{t('pages.achievements.goalType')}</InputLabel>
              <Select
                value={selectedType}
                onChange={(e) => handleTypeChange(e.target.value)}
                label={t('pages.achievements.goalType')}
              >
                {goalTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Box sx={{ mr: 2, display: 'flex', color: 'action.active' }}>
                        {type.icon}
                      </Box>
                      <Typography sx={{ flexGrow: 1 }}>{type.name}</Typography>
                      {getDataSourceBadge(type.dataSource)}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {editingGoal && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ mr: 2, display: 'flex', color: 'primary.main' }}>
                  {currentGoalType.icon}
                </Box>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  {currentGoalType.name}
                </Typography>
                {getDataSourceBadge(currentGoalType.dataSource)}
              </Box>
            </Box>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              {t('pages.achievements.targetValue')}
            </Typography>

            {currentGoalType.presets && currentGoalType.presets.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <ToggleButtonGroup
                  value={inputMode}
                  exclusive
                  onChange={(_, newMode) => newMode && setInputMode(newMode)}
                  size="small"
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  <ToggleButton value="preset">
                    {t('pages.achievements.presetValues')}
                  </ToggleButton>
                  <ToggleButton value="custom">
                    {t('pages.achievements.customValue')}
                  </ToggleButton>
                </ToggleButtonGroup>

                {inputMode === 'preset' && (
                  <ToggleButtonGroup
                    value={String(targetValue)}
                    exclusive
                    onChange={handlePresetChange}
                    fullWidth
                  >
                    {currentGoalType.presets.map((preset) => (
                      <ToggleButton key={preset.value} value={String(preset.value)}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2">{preset.label}</Typography>
                          <Typography variant="h6">
                            {preset.value} {currentGoalType.unit}
                          </Typography>
                        </Box>
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                )}
              </Box>
            )}

            {(inputMode === 'custom' || !currentGoalType.presets) && (
              <TextField
                fullWidth
                type="number"
                value={targetValue}
                onChange={(e) => handleCustomValueChange(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {currentGoalType.unit}
                    </InputAdornment>
                  ),
                  inputProps: {
                    min: currentGoalType.min,
                    max: currentGoalType.max,
                    step: currentGoalType.step,
                  },
                }}
                helperText={currentGoalType.helperText || `${currentGoalType.min} ~ ${currentGoalType.max} ${currentGoalType.unit}`}
                error={!!error}
              />
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {currentGoalType.dataSource === 'ai_nutrition' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {t('pages.achievements.aiNutritionInfo')}
            </Alert>
          )}

          {currentGoalType.dataSource === 'ai_workout' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {t('pages.achievements.aiWorkoutInfo')}
            </Alert>
          )}

          {currentGoalType.dataSource === 'manual' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {t('pages.achievements.manualInputInfo')}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          sx={{
            background: 'linear-gradient(135deg, #00D4FF 0%, #00FFB3 100%)',
            color: '#000',
          }}
        >
          {editingGoal ? t('common.save') : t('pages.achievements.create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GoalCreationDialog;
