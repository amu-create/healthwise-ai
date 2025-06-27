import json
import numpy as np
import math
from typing import Dict, List, Tuple, Any


class MediaPipeProcessor:
    """MediaPipe 포즈 분석 프로세서"""
    
    # MediaPipe 랜드마크 인덱스
    POSE_LANDMARKS = {
        'nose': 0,
        'left_eye_inner': 1,
        'left_eye': 2,
        'left_eye_outer': 3,
        'right_eye_inner': 4,
        'right_eye': 5,
        'right_eye_outer': 6,
        'left_ear': 7,
        'right_ear': 8,
        'mouth_left': 9,
        'mouth_right': 10,
        'left_shoulder': 11,
        'right_shoulder': 12,
        'left_elbow': 13,
        'right_elbow': 14,
        'left_wrist': 15,
        'right_wrist': 16,
        'left_pinky': 17,
        'right_pinky': 18,
        'left_index': 19,
        'right_index': 20,
        'left_thumb': 21,
        'right_thumb': 22,
        'left_hip': 23,
        'right_hip': 24,
        'left_knee': 25,
        'right_knee': 26,
        'left_ankle': 27,
        'right_ankle': 28,
        'left_heel': 29,
        'right_heel': 30,
        'left_foot_index': 31,
        'right_foot_index': 32
    }
    
    def __init__(self):
        self.min_detection_confidence = 0.5
        self.min_tracking_confidence = 0.5
    
    def calculate_angle(self, p1: Dict, p2: Dict, p3: Dict) -> float:
        """세 점 사이의 각도 계산"""
        try:
            # 2D 좌표로 계산
            a = np.array([p1['x'], p1['y']])
            b = np.array([p2['x'], p2['y']])
            c = np.array([p3['x'], p3['y']])
            
            ba = a - b
            bc = c - b
            
            cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
            angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
            
            return np.degrees(angle)
        except:
            return 0
    
    def calculate_distance(self, p1: Dict, p2: Dict) -> float:
        """두 점 사이의 거리 계산"""
        return math.sqrt((p1['x'] - p2['x'])**2 + (p1['y'] - p2['y'])**2)
    
    def analyze_pose(self, landmarks: List[Dict], exercise) -> Dict:
        """포즈 분석"""
        if not landmarks or len(landmarks) < 33:
            return self._empty_result()
        
        # 랜드마크를 딕셔너리로 변환
        pose_dict = {}
        for i, landmark in enumerate(landmarks):
            for name, idx in self.POSE_LANDMARKS.items():
                if idx == i:
                    pose_dict[name] = landmark
                    break
        
        # 운동별 분석
        if exercise.name == '스쿼트':
            return self._analyze_squat(pose_dict)
        elif exercise.name == '푸쉬업':
            return self._analyze_pushup(pose_dict)
        elif exercise.name == '플랭크':
            return self._analyze_plank(pose_dict)
        elif exercise.name == '런지':
            return self._analyze_lunge(pose_dict)
        elif exercise.name == '버피':
            return self._analyze_burpee(pose_dict)
        else:
            # 기본 분석
            return self._analyze_general(pose_dict)
    
    def _analyze_squat(self, pose: Dict) -> Dict:
        """스쿼트 분석"""
        angles = {}
        scores = {}
        feedback = []
        corrections = []
        
        # 무릎 각도 계산
        left_knee_angle = self.calculate_angle(
            pose['left_hip'], pose['left_knee'], pose['left_ankle']
        )
        right_knee_angle = self.calculate_angle(
            pose['right_hip'], pose['right_knee'], pose['right_ankle']
        )
        
        angles['left_knee'] = left_knee_angle
        angles['right_knee'] = right_knee_angle
        
        # 엉덩이 각도
        left_hip_angle = self.calculate_angle(
            pose['left_shoulder'], pose['left_hip'], pose['left_knee']
        )
        right_hip_angle = self.calculate_angle(
            pose['right_shoulder'], pose['right_hip'], pose['right_knee']
        )
        
        angles['left_hip'] = left_hip_angle
        angles['right_hip'] = right_hip_angle
        
        # 무릎 각도 평가 (이상적: 90도)
        knee_score = max(0, 100 - abs(90 - (left_knee_angle + right_knee_angle) / 2) * 2)
        scores['knee'] = knee_score
        
        if knee_score < 70:
            if (left_knee_angle + right_knee_angle) / 2 > 90:
                feedback.append("무릎을 더 굽히세요")
                corrections.append("depth")
            else:
                feedback.append("너무 깊이 내려갔습니다")
                corrections.append("too_deep")
        
        # 무릎 위치 체크
        left_knee_forward = pose['left_knee']['x'] > pose['left_ankle']['x']
        right_knee_forward = pose['right_knee']['x'] > pose['right_ankle']['x']
        
        if left_knee_forward or right_knee_forward:
            feedback.append("무릎이 발끝을 넘지 않도록 주의하세요")
            corrections.append("knee_position")
            scores['knee_position'] = 70
        else:
            scores['knee_position'] = 100
        
        # 자세 체크
        is_in_position = knee_score > 60 and abs(left_knee_angle - right_knee_angle) < 15
        
        # 전체 점수
        overall_score = sum(scores.values()) / len(scores)
        
        return {
            'angles': angles,
            'scores': scores,
            'overall_score': overall_score,
            'feedback': feedback,
            'corrections': corrections,
            'is_in_position': is_in_position
        }
    
    def _analyze_pushup(self, pose: Dict) -> Dict:
        """푸쉬업 분석"""
        angles = {}
        scores = {}
        feedback = []
        corrections = []
        
        # 팔꿈치 각도
        left_elbow_angle = self.calculate_angle(
            pose['left_shoulder'], pose['left_elbow'], pose['left_wrist']
        )
        right_elbow_angle = self.calculate_angle(
            pose['right_shoulder'], pose['right_elbow'], pose['right_wrist']
        )
        
        angles['left_elbow'] = left_elbow_angle
        angles['right_elbow'] = right_elbow_angle
        
        # 몸통 각도 (플랭크 자세)
        body_angle = self.calculate_angle(
            pose['left_shoulder'], pose['left_hip'], pose['left_ankle']
        )
        angles['body'] = body_angle
        
        # 팔꿈치 각도 평가
        elbow_score = max(0, 100 - abs(90 - (left_elbow_angle + right_elbow_angle) / 2) * 2)
        scores['elbow'] = elbow_score
        
        # 몸통 일직선 평가
        body_score = max(0, 100 - abs(180 - body_angle) * 2)
        scores['body'] = body_score
        
        if body_score < 80:
            if body_angle < 170:
                feedback.append("엉덩이를 너무 높이 들었습니다")
                corrections.append("hips_high")
            else:
                feedback.append("엉덩이가 너무 낮습니다")
                corrections.append("hips_low")
        
        is_in_position = elbow_score > 60 and body_score > 70
        overall_score = (elbow_score + body_score) / 2
        
        return {
            'angles': angles,
            'scores': scores,
            'overall_score': overall_score,
            'feedback': feedback,
            'corrections': corrections,
            'is_in_position': is_in_position
        }
    
    def _analyze_plank(self, pose: Dict) -> Dict:
        """플랭크 분석"""
        angles = {}
        scores = {}
        feedback = []
        corrections = []
        
        # 몸통 각도
        body_angle = self.calculate_angle(
            pose['left_shoulder'], pose['left_hip'], pose['left_ankle']
        )
        angles['body'] = body_angle
        
        # 팔꿈치 각도
        left_elbow_angle = self.calculate_angle(
            pose['left_shoulder'], pose['left_elbow'], pose['left_wrist']
        )
        angles['left_elbow'] = left_elbow_angle
        
        # 몸통 일직선 평가
        body_score = max(0, 100 - abs(180 - body_angle) * 3)
        scores['body'] = body_score
        
        if body_score < 80:
            if body_angle < 170:
                feedback.append("엉덩이를 내리고 몸을 일직선으로 유지하세요")
                corrections.append("hips_high")
            else:
                feedback.append("코어에 힘을 주고 엉덩이를 살짝 올리세요")
                corrections.append("hips_low")
        
        # 어깨 위치 체크
        shoulder_alignment = abs(pose['left_elbow']['x'] - pose['left_shoulder']['x'])
        if shoulder_alignment > 0.1:
            feedback.append("어깨가 팔꿈치 위에 위치하도록 조정하세요")
            scores['shoulder'] = 80
        else:
            scores['shoulder'] = 100
        
        is_in_position = body_score > 70
        overall_score = sum(scores.values()) / len(scores)
        
        return {
            'angles': angles,
            'scores': scores,
            'overall_score': overall_score,
            'feedback': feedback,
            'corrections': corrections,
            'is_in_position': is_in_position
        }
    
    def _analyze_lunge(self, pose: Dict) -> Dict:
        """런지 분석"""
        angles = {}
        scores = {}
        feedback = []
        corrections = []
        
        # 앞쪽 무릎 각도
        front_knee_angle = self.calculate_angle(
            pose['left_hip'], pose['left_knee'], pose['left_ankle']
        )
        # 뒤쪽 무릎 각도
        back_knee_angle = self.calculate_angle(
            pose['right_hip'], pose['right_knee'], pose['right_ankle']
        )
        
        angles['front_knee'] = front_knee_angle
        angles['back_knee'] = back_knee_angle
        
        # 앞쪽 무릎 평가 (이상적: 90도)
        front_knee_score = max(0, 100 - abs(90 - front_knee_angle) * 2)
        scores['front_knee'] = front_knee_score
        
        # 뒤쪽 무릎 평가 (이상적: 90도)
        back_knee_score = max(0, 100 - abs(90 - back_knee_angle) * 2)
        scores['back_knee'] = back_knee_score
        
        if front_knee_score < 70:
            feedback.append("앞쪽 무릎을 90도로 굽히세요")
            corrections.append("front_knee_angle")
        
        if back_knee_score < 70:
            feedback.append("뒤쪽 무릎이 바닥에 가깝게 내려가도록 하세요")
            corrections.append("back_knee_angle")
        
        # 무릎 위치 체크
        if pose['left_knee']['x'] > pose['left_ankle']['x'] + 0.05:
            feedback.append("앞쪽 무릎이 발끝을 넘지 않도록 주의하세요")
            scores['knee_position'] = 70
        else:
            scores['knee_position'] = 100
        
        is_in_position = front_knee_score > 60 and back_knee_score > 60
        overall_score = sum(scores.values()) / len(scores)
        
        return {
            'angles': angles,
            'scores': scores,
            'overall_score': overall_score,
            'feedback': feedback,
            'corrections': corrections,
            'is_in_position': is_in_position
        }
    
    def _analyze_burpee(self, pose: Dict) -> Dict:
        """버피 분석 - 동작이 복잡하므로 기본적인 체크만"""
        angles = {}
        scores = {}
        feedback = []
        corrections = []
        
        # 현재 자세 추정
        hip_height = pose['left_hip']['y']
        shoulder_height = pose['left_shoulder']['y']
        
        # 스쿼트 자세인지 체크
        if hip_height > 0.6:
            phase = "standing"
            scores['posture'] = 100
        elif hip_height > 0.3:
            phase = "squat"
            # 스쿼트 자세 체크
            knee_angle = self.calculate_angle(
                pose['left_hip'], pose['left_knee'], pose['left_ankle']
            )
            angles['knee'] = knee_angle
            scores['posture'] = max(0, 100 - abs(90 - knee_angle) * 2)
        else:
            phase = "plank"
            # 플랭크 자세 체크
            body_angle = self.calculate_angle(
                pose['left_shoulder'], pose['left_hip'], pose['left_ankle']
            )
            angles['body'] = body_angle
            scores['posture'] = max(0, 100 - abs(180 - body_angle) * 2)
        
        # 일반적인 피드백
        if phase == "squat" and scores['posture'] < 70:
            feedback.append("스쿼트 자세를 정확히 유지하세요")
        elif phase == "plank" and scores['posture'] < 70:
            feedback.append("플랭크 자세에서 몸을 일직선으로 유지하세요")
        
        is_in_position = scores.get('posture', 0) > 60
        overall_score = scores.get('posture', 80)
        
        return {
            'angles': angles,
            'scores': scores,
            'overall_score': overall_score,
            'feedback': feedback,
            'corrections': corrections,
            'is_in_position': is_in_position,
            'phase': phase
        }
    
    def _analyze_general(self, pose: Dict) -> Dict:
        """일반적인 포즈 분석"""
        return {
            'angles': {},
            'scores': {'general': 80},
            'overall_score': 80,
            'feedback': ["자세를 유지하세요"],
            'corrections': [],
            'is_in_position': True
        }
    
    def _empty_result(self) -> Dict:
        """빈 결과 반환"""
        return {
            'angles': {},
            'scores': {},
            'overall_score': 0,
            'feedback': ["포즈를 감지할 수 없습니다"],
            'corrections': [],
            'is_in_position': False
        }
    
    def analyze_video(self, video_path: str, exercise) -> List[Dict]:
        """비디오 분석 (더미 구현)"""
        # 실제 구현시에는 OpenCV와 MediaPipe Python을 사용해야 함
        # 여기서는 더미 데이터 반환
        results = []
        
        # 30fps 가정, 10초 비디오
        for i in range(300):
            timestamp = i / 30.0
            # 더미 랜드마크 생성
            landmarks = []
            for j in range(33):
                landmarks.append({
                    'x': 0.5 + np.random.randn() * 0.1,
                    'y': 0.5 + np.random.randn() * 0.1,
                    'z': 0.0,
                    'visibility': 0.9
                })
            
            result = self.analyze_pose(landmarks, exercise)
            result['timestamp'] = timestamp
            results.append(result)
        
        return results
