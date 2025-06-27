// 공통 모듈
import common from './modules/common.json';
import languages from './modules/languages.json';
import navigation from './modules/navigation.json';
import auth from './modules/auth.json';
import profile from './modules/profile.json';
import dashboard from './modules/dashboard.json';
import notifications from './modules/notifications.json';
import signup from './modules/signup.json';
import home from './modules/home.json';
import errors from './modules/errors.json';
import messages from './modules/messages.json';

// 랜딩 페이지 모듈
import landingHero from './modules/landing/hero.json';
import landingFeatures from './modules/landing/features.json';
import landingServices from './modules/landing/services.json';
import landingPricing from './modules/landing/pricing.json';
import landingOthers from './modules/landing/others.json';

// 페이지별 모듈
import achievements from './modules/pages/achievements.json';
import aiWorkout from './modules/pages/aiWorkout.json';
import map from './modules/pages/map.json';
import aiNutrition from './modules/pages/aiNutrition.json';
import nutrition from './modules/pages/nutrition.json';
import exercise from './modules/pages/exercise.json';
import chat from './modules/pages/chat.json';
import music from './modules/pages/music.json';

// 통합 번역 객체
const translation = {
  translation: {
    common,
    languages,
    navigation,
    auth,
    profile,
    dashboard,
    notifications,
    signup,
    home,
    errors,
    messages,
    landing: {
      hero: landingHero,
      features: landingFeatures,
      services: landingServices,
      pricing: landingPricing,
      ...landingOthers
    },
    pages: {
      achievements,
      aiWorkout,
      map,
      aiNutrition,
      nutrition,
      exercise,
      chat,
      music
    }
  }
};

export default translation;
