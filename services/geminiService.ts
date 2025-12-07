import { REVIEW_DATA } from '../constants';
import { Question, ReviewItem } from '../types';

/**
 * Helper to shuffle an array (Fisher-Yates)
 */
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Generates a multiple-choice challenge question using local data.
 * No API calls required.
 */
export const generateQuestion = async (mistakes: number[] = []): Promise<Question> => {
  let item: ReviewItem;

  // Mistake Review Logic: 40% chance to review a mistake
  const shouldReviewMistake = mistakes.length > 0 && Math.random() < 0.4;
  
  if (shouldReviewMistake) {
    const mistakeId = mistakes[Math.floor(Math.random() * mistakes.length)];
    const found = REVIEW_DATA.find(i => i.id === mistakeId);
    item = found || REVIEW_DATA[Math.floor(Math.random() * REVIEW_DATA.length)];
  } else {
    const randomIndex = Math.floor(Math.random() * REVIEW_DATA.length);
    item = REVIEW_DATA[randomIndex];
  }

  // Generate Distractors
  const distractors: string[] = [];
  // Try to find distractors of the same type if possible
  const sameTypeItems = REVIEW_DATA.filter(i => i.type === item.type && i.id !== item.id);
  
  while (distractors.length < 3) {
    // If we run out of same type, use any item
    const pool = sameTypeItems.length >= 3 ? sameTypeItems : REVIEW_DATA.filter(i => i.id !== item.id);
    const randomIdx = Math.floor(Math.random() * pool.length);
    const randomItem = pool[randomIdx];
    
    if (!distractors.includes(randomItem.english)) {
      distractors.push(randomItem.english);
    }
  }

  const options = shuffleArray([item.english, ...distractors]);

  // Construct Question Object
  // Since we don't have AI to generate contexts, we use a standard translation template.
  
  // Handle multi-part phrases (e.g. "add...to...")
  // If english is "add...to...", context should look like "add ______ to ______"? 
  // Simpler approach for static generation: Use the Chinese definition as the prompt.
  
  return {
    type: 'multiple-choice',
    reviewId: item.id,
    questionText: `Choose the correct phrase for: ${item.chinese}`,
    // Create a simple "fill in the blank" style context
    contextSentence: `${item.chinese} means ______ in English.`, 
    fullSentence: `${item.chinese} means ${item.english} in English.`,
    hint: item.chinese,
    targetAnswer: item.english,
    options: options,
  };
};

/**
 * Uses browser's native SpeechSynthesis API to read text.
 * Returns a Promise that resolves when speaking is finished.
 */
export const playTextToSpeech = (text: string): Promise<void> => {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      console.warn("Browser does not support Speech Synthesis");
      resolve();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; // Set to English
    utterance.rate = 0.9;     // Slightly slower for clarity
    utterance.pitch = 1;

    utterance.onend = () => {
      resolve();
    };

    utterance.onerror = (e) => {
      console.error("Speech Synthesis Error", e);
      resolve(); // Resolve anyway so game continues
    };

    window.speechSynthesis.speak(utterance);
  });
};

// Deprecated functions kept as no-ops or aliases to prevent breakages if referenced elsewhere
export const fetchTTS = async (text: string) => null;
export const playAudioBuffer = async (buffer: any) => {};
