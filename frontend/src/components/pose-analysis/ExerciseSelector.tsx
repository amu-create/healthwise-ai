import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  Box,
  Typography,
  Divider
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { exerciseCategories } from '../../services/pose-analysis/exercises';

interface Exercise {
  id: number | string;
  name: string;
  name_en?: string;
  nameEn?: string;
  category: string;
  difficulty: string;
  description: string;
  target_muscles?: string[];
  targetMuscles?: string[];
  icon?: string;
}

interface ExerciseSelectorProps {
  exercises: Exercise[];
  selectedExercise: Exercise;
  selectedCategory: string;
  onExerciseSelect: (exercise: Exercise) => void;
  onCategorySelect: (category: string) => void;
  disabled?: boolean;
}

const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
  exercises,
  selectedExercise,
  selectedCategory,
  onExerciseSelect,
  onCategorySelect,
  disabled = false
}) => {
  const { t } = useTranslation();
  
  // 카테고리별 필터링
  const filteredExercises = selectedCategory === 'all' 
    ? exercises 
    : exercises.filter(ex => ex.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'error';
      default:
        return 'default';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return t('pose_analysis.difficulty.beginner');
      case 'intermediate':
        return t('pose_analysis.difficulty.intermediate');
      case 'advanced':
        return t('pose_analysis.difficulty.advanced');
      default:
        return difficulty;
    }
  };

  return (
    <>
      {/* 카테고리 선택 */}
      <Card sx={{ mb: 2 }}>
        <CardHeader title={t('pose_analysis.exercise_category')} />
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {exerciseCategories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'contained' : 'outlined'}
                size="small"
                startIcon={<span>{category.icon}</span>}
                onClick={() => onCategorySelect(category.id)}
                disabled={disabled}
                sx={{ mb: 1 }}
              >
                {category.name}
              </Button>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* 운동 리스트 */}
      <Card>
        <CardHeader title={t('pose_analysis.select_exercise')} />
        <CardContent sx={{ p: 0 }}>
          <List sx={{ maxHeight: 500, overflow: 'auto' }}>
            {filteredExercises.map((exercise, index) => (
              <React.Fragment key={exercise.id}>
                {index > 0 && <Divider />}
                <ListItem disablePadding>
                  <ListItemButton
                    selected={selectedExercise?.id === exercise.id}
                    onClick={() => onExerciseSelect(exercise)}
                    disabled={disabled}
                  >
                    <ListItemIcon>
                      <Typography variant="h4">{exercise.icon}</Typography>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            {exercise.name}
                          </Typography>
                          <Chip
                            label={getDifficultyText(exercise.difficulty)}
                            size="small"
                            color={getDifficultyColor(exercise.difficulty) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {exercise.description}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>
    </>
  );
};

export default ExerciseSelector;
