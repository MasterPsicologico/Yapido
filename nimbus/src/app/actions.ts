
'use server';

import {
  generateArticleContent,
  getRecommendedCategory,
  searchArticles,
  rateArticle,
} from './blog/actions';

import {
  analyzeSentimentAction,
  getTacticalAdviceAction
} from './gym/actions';

import {
    interpretDreamAction,
    analyzeDreamVoiceAction,
} from './dreams/actions';

import {
    updatePsychologicalBlueprint,
    generateBreakdownExerciseAction,
} from './profile/actions';

import {
    determineAnchorRole,
    getAIResponse,
    getSmartComposeSuggestions,
    getInitialPrompts,
    generateMorePrompts,
    generateChatTitle,
    classifyIntentAction,
    generateImagePrompt,
    generateImageX,
} from './c/actions';


export {
  // Blog
  generateArticleContent,
  getRecommendedCategory,
  searchArticles,
  rateArticle,
  // Gym
  analyzeSentimentAction,
  getTacticalAdviceAction,
  // Dreams
  interpretDreamAction,
  analyzeDreamVoiceAction,
  // Profile
  updatePsychologicalBlueprint,
  generateBreakdownExerciseAction,
  // Chat
  determineAnchorRole,
  getAIResponse,
  getSmartComposeSuggestions,
  getInitialPrompts,
  generateMorePrompts,
  generateChatTitle,
  classifyIntentAction,
  generateImagePrompt,
  generateImageX,
};
