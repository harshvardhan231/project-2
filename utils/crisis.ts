const CRISIS_KEYWORDS = [
  "kill myself",
  "end my life",
  "suicide",
  "suicidal",
  "want to die",
  "can't go on",
  "hurt myself",
  "hang myself",
  "take pills",
  "self harm",
  "cut myself",
  "overdose",
];

export function detectCrisis(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  for (const keyword of CRISIS_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      console.log("Crisis detected - triggering intervention");
      return true;
    }
  }
  
  return false;
}

export function getSentimentScore(text: string): number {
  const negativeWords = [
    "sad", "depressed", "anxious", "worried", "scared",
    "angry", "frustrated", "hopeless", "worthless", "alone"
  ];
  
  const positiveWords = [
    "happy", "joy", "excited", "grateful", "peaceful",
    "calm", "content", "proud", "confident", "loved"
  ];
  
  const lowerText = text.toLowerCase();
  let score = 0;
  
  for (const word of positiveWords) {
    if (lowerText.includes(word)) score += 0.1;
  }
  
  for (const word of negativeWords) {
    if (lowerText.includes(word)) score -= 0.1;
  }
  
  return Math.max(-1, Math.min(1, score));
}