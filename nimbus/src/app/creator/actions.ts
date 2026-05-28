
'use server';

/**
 * @fileOverview Server actions for the GICI (Generador Inteligente de Contenido Ilustrado) module.
 * This file acts as the official bridge between client components and the AI generation flows.
 */

import {
  generateCourseStructure as generateCourseStructureFlow,
  generateChapterContent as generateChapterContentFlow,
  generateImagePrompt as generateImagePromptFlow,
} from '@/ai/flows/course-creation-flow';

import { generateImageX } from '@/ai/flows/generate-image-x';
import {
  generateComicAnalysisFlow,
  generateComicPageFlow,
  continueComicStoryFlow,
} from '@/ai/flows/comic-creation-flow';

import type {
  CourseStructure,
} from '@/lib/types';


// We re-export the flows through this server actions file to ensure
// Next.js correctly creates the server action proxy.

export async function generateCourseStructure(input: { topic: string }): Promise<CourseStructure> {
  return generateCourseStructureFlow(input);
}

export async function generateChapterContent(input: { courseTitle: string; moduleTitle: string; chapterTitle: string; }) {
  return generateChapterContentFlow(input);
}

export async function generateImagePrompt(input: { title: string; context: string; }) {
  return generateImagePromptFlow(input);
}

// --- Comic Actions ---
export { generateComicAnalysisFlow, generateComicPageFlow, continueComicStoryFlow };


export { generateImageX };
