export interface ShuffledQuestion {
  originalQuestion: string;
  shuffledAnswers: Array<{
    letter: 'A' | 'B' | 'C' | 'D';
    text: string;
    isCorrect: boolean;
  }>;
  correctAnswerLetter: 'A' | 'B' | 'C' | 'D';
}

/**
 * Shuffles the answers for a trivia question and returns the new arrangement
 * with tracking of which letter is now the correct answer
 */
export function shuffleQuestionAnswers(questionData: {
  question: string;
  a: string; // Always the correct answer in database
  b: string;
  c: string;
  d: string;
}): ShuffledQuestion {
  // Create array of answers with their original correctness
  const answers = [
    { text: questionData.a, isCorrect: true, originalLetter: 'a' },
    { text: questionData.b, isCorrect: false, originalLetter: 'b' },
    { text: questionData.c, isCorrect: false, originalLetter: 'c' },
    { text: questionData.d, isCorrect: false, originalLetter: 'd' },
  ];

  // Fisher-Yates shuffle algorithm
  for (let i = answers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [answers[i], answers[j]] = [answers[j], answers[i]];
  }

  // Map to new letter positions
  const shuffledAnswers = answers.map((answer, index) => ({
    letter: ['A', 'B', 'C', 'D'][index] as 'A' | 'B' | 'C' | 'D',
    text: answer.text,
    isCorrect: answer.isCorrect,
  }));

  // Find which letter is now correct
  const correctAnswerLetter = shuffledAnswers.find(answer => answer.isCorrect)?.letter || 'A';

  return {
    originalQuestion: questionData.question,
    shuffledAnswers,
    correctAnswerLetter,
  };
}

/**
 * Converts a shuffled answer letter back to the original database letter
 * for answer submission (always 'a' since that's the correct answer in DB)
 */
export function convertShuffledAnswerToOriginal(
  shuffledQuestion: ShuffledQuestion,
  selectedLetter: 'A' | 'B' | 'C' | 'D'
): 'a' | 'b' | 'c' | 'd' {
  // Find if the selected letter corresponds to the correct answer
  const selectedAnswer = shuffledQuestion.shuffledAnswers.find(
    answer => answer.letter === selectedLetter
  );
  
  // If it's the correct answer, return 'a' (correct in database)
  // Otherwise return any incorrect letter (we'll use 'b')
  return selectedAnswer?.isCorrect ? 'a' : 'b';
}