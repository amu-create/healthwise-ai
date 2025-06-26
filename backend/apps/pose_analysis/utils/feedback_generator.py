from typing import Dict, List
import random


class FeedbackGenerator:
    """운동 피드백 생성기"""
    
    def __init__(self):
        self.positive_feedback = [
            "좋습니다! 자세를 유지하세요",
            "훌륭합니다! 계속 진행하세요",
            "완벽한 자세입니다",
            "아주 좋아요! 집중력이 뛰어나네요",
            "정확한 동작입니다"
        ]
        
        self.encouragement = [
            "조금만 더 힘내세요!",
            "거의 다 왔습니다!",
            "포기하지 마세요!",
            "할 수 있습니다!",
            "집중하세요!"
        ]
    
    def generate_realtime_feedback(self, analysis_result: Dict, exercise) -> Dict:
        """실시간 피드백 생성"""
        score = analysis_result['overall_score']
        feedback_messages = []
        
        # 점수에 따른 기본 피드백
        if score >= 90:
            feedback_messages.append(random.choice(self.positive_feedback))
        elif score >= 70:
            feedback_messages.append("자세가 좋습니다. 조금만 더 신경쓰세요")
        else:
            feedback_messages.append("자세를 수정해주세요")
        
        # 구체적인 교정 피드백 추가
        if analysis_result['feedback']:
            feedback_messages.extend(analysis_result['feedback'][:2])  # 최대 2개까지
        
        # 운동별 특별 피드백
        feedback_messages.extend(self._get_exercise_specific_feedback(
            exercise, 
            analysis_result
        ))
        
        return {
            'messages': feedback_messages,
            'score': score,
            'corrections_needed': len(analysis_result['corrections']) > 0,
            'audio_cue': self._get_audio_cue(score, analysis_result['corrections'])
        }
    
    def _get_exercise_specific_feedback(self, exercise, analysis_result: Dict) -> List[str]:
        """운동별 특화 피드백"""
        feedback = []
        
        if exercise.name == '스쿼트':
            if 'knee' in analysis_result['scores']:
                knee_score = analysis_result['scores']['knee']
                if knee_score < 60:
                    feedback.append("무릎이 발끝을 넘어가지 않도록 주의하세요")
                elif knee_score < 80:
                    feedback.append("무릎 각도를 조금 더 깊게 하세요")
        
        elif exercise.name == '푸쉬업':
            if 'body' in analysis_result['scores']:
                body_score = analysis_result['scores']['body']
                if body_score < 70:
                    feedback.append("몸통을 일직선으로 유지하세요")
        
        elif exercise.name == '플랭크':
            if analysis_result['is_in_position']:
                # 플랭크는 유지 시간이 중요
                feedback.append("자세를 유지하세요. 호흡을 잊지 마세요")
        
        return feedback
    
    def _get_audio_cue(self, score: float, corrections: List[str]) -> str:
        """오디오 큐 결정"""
        if score >= 90:
            return "success"
        elif score >= 70:
            return "good"
        elif len(corrections) > 2:
            return "warning"
        else:
            return "neutral"
    
    def generate_session_summary(self, session) -> Dict:
        """세션 요약 피드백 생성"""
        summary = {
            'overall_performance': "",
            'strengths': [],
            'improvements': [],
            'next_steps': []
        }
        
        avg_score = session.average_score or 0
        
        # 전반적인 평가
        if avg_score >= 90:
            summary['overall_performance'] = "훌륭한 운동이었습니다! 거의 완벽한 자세를 유지했네요."
        elif avg_score >= 75:
            summary['overall_performance'] = "좋은 운동이었습니다. 몇 가지 부분만 개선하면 더 좋아질 거예요."
        elif avg_score >= 60:
            summary['overall_performance'] = "괜찮은 시작입니다. 꾸준히 연습하면 금세 향상될 거예요."
        else:
            summary['overall_performance'] = "기초부터 차근차근 연습해봅시다. 포기하지 마세요!"
        
        # 강점 분석
        if session.max_score and session.max_score >= 85:
            summary['strengths'].append("최고 점수가 높아 잠재력이 뛰어납니다")
        
        if session.duration and session.duration > 300:  # 5분 이상
            summary['strengths'].append("지구력이 좋습니다")
        
        # 개선점 분석
        if session.min_score and session.min_score < 60:
            summary['improvements'].append("일관성 있는 자세 유지가 필요합니다")
        
        if avg_score < 70:
            summary['improvements'].append("기본 자세를 더 연습해주세요")
        
        # 다음 단계 제안
        if avg_score >= 85:
            summary['next_steps'].append("난이도를 높여보세요")
            summary['next_steps'].append("세트 수를 늘려보세요")
        else:
            summary['next_steps'].append("같은 운동을 반복 연습하세요")
            summary['next_steps'].append("거울을 보며 자세를 확인하세요")
        
        return summary
