// src/lib/voiceParser.ts
/**
 * Smart speech-to-text cleaner and parser tailored for noisy event gates.
 * Handles spoken email conventions, phone numbers with spoken digits,
 * and attendee names with conversational preambles stripped.
 */

const NUMBER_WORDS: Record<string, string> = {
  zero: '0',
  oh: '0',
  o: '0',
  one: '1',
  won: '1',
  two: '2',
  to: '2',
  too: '2',
  three: '3',
  four: '4',
  for: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  ate: '8',
  nine: '9',
  ten: '10',
  eleven: '11',
  twelve: '12',
  thirteen: '13',
  fourteen: '14',
  fifteen: '15',
  sixteen: '16',
  seventeen: '17',
  eighteen: '18',
  nineteen: '19',
  twenty: '20',
  thirty: '30',
  forty: '40',
  fifty: '50',
  sixty: '60',
  seventy: '70',
  eighty: '80',
  ninety: '90',
};

const DOUBLE_WORDS: Record<string, string> = {
  zero: '00',
  one: '11',
  two: '22',
  three: '33',
  four: '44',
  five: '55',
  six: '66',
  seven: '77',
  eight: '88',
  nine: '99',
};

const TRIPLE_WORDS: Record<string, string> = {
  zero: '000',
  one: '111',
  two: '222',
  three: '333',
  four: '444',
  five: '555',
  six: '666',
  seven: '777',
  eight: '888',
  nine: '999',
};

/**
 * Clean spoken email addresses over gate noise.
 * Converts "john dot doe at gmail dot com" -> "johndoe@gmail.com"
 * Removes background words if an email candidate is recognized.
 */
export function cleanVoiceEmail(transcript: string): string {
  if (!transcript) return '';

  // 1. Direct regex check: if transcript already contains a standard email pattern, extract it!
  const directMatch = transcript.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (directMatch) {
    return directMatch[0].toLowerCase();
  }

  let text = transcript.toLowerCase();

  // 2. Strip conversational preambles common at the gate
  text = text
    .replace(/^(my\s+)?(email\s+is|email\s+address\s+is|email|send\s+it\s+to|send\s+to|it\s+is|it's)\s+/i, '')
    .trim();

  // 3. Remove polite noise at the end
  text = text.replace(/\s+(please|thanks|thank\s+you|alright|okay|bro|sir|ma)\.?$/i, '');

  // 4. Common spoken symbol replacements
  text = text
    .replace(/\s*(at\s+the\s+rate\s+of|at\s+the\s+rate|at\s+sign|\bat\b|@)\s*/gi, '@')
    .replace(/\s*(\bdot\b|\bpoint\b|\bperiod\b)\s*/gi, '.')
    .replace(/\s*(\bunderscore\b|\bunder\s+score\b)\s*/gi, '_')
    .replace(/\s*(\bdash\b|\bhyphen\b|\bminus\b)\s*/gi, '-');

  // 5. Replace common spoken numbers in usernames (e.g., "ade 24" or "ade twenty four")
  const words = text.split(/\s+/);
  const convertedWords = words.map((w) => NUMBER_WORDS[w] || w);
  text = convertedWords.join('');

  // 6. Handle common domains missing dot com (e.g. "@gmail" -> "@gmail.com")
  if (text.includes('@gmail') && !text.includes('@gmail.')) {
    text = text.replace(/@gmail(\b|$)/, '@gmail.com');
  } else if (text.includes('@yahoo') && !text.includes('@yahoo.')) {
    text = text.replace(/@yahoo(\b|$)/, '@yahoo.com');
  } else if (text.includes('@hotmail') && !text.includes('@hotmail.')) {
    text = text.replace(/@hotmail(\b|$)/, '@hotmail.com');
  } else if (text.includes('@outlook') && !text.includes('@outlook.')) {
    text = text.replace(/@outlook(\b|$)/, '@outlook.com');
  } else if (text.includes('@icloud') && !text.includes('@icloud.')) {
    text = text.replace(/@icloud(\b|$)/, '@icloud.com');
  }

  // 7. Strip all whitespace and ending punctuation
  text = text.replace(/\s+/g, '').replace(/[.,;:!?]+$/, '');

  // 8. If surrounded by leftover letters before or after the email, extract the best candidate
  const candidateMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (candidateMatch) {
    return candidateMatch[0];
  }

  return text;
}

/**
 * Clean spoken phone numbers over gate noise.
 * Converts "zero eight zero three one two three four five six seven" -> "08031234567"
 * Handles "double [digit]", "triple [digit]", "oh" -> 0, "+234", etc.
 */
export function cleanVoicePhone(transcript: string): string {
  if (!transcript) return '';

  let text = transcript.toLowerCase();

  // Strip conversational preambles
  text = text
    .replace(/^(my\s+)?(phone\s+number\s+is|phone\s+is|number\s+is|phone|call\s+me\s+on|it\s+is|it's)\s+/i, '')
    .trim();

  // Replace spoken "plus"
  text = text.replace(/\bplus\b/gi, '+');

  // Handle "double [digit]" and "triple [digit]"
  text = text.replace(/\bdouble\s+(zero|one|two|three|four|five|six|seven|eight|nine)\b/gi, (_, digit) => {
    return DOUBLE_WORDS[digit.toLowerCase()] || digit;
  });
  text = text.replace(/\btriple\s+(zero|one|two|three|four|five|six|seven|eight|nine)\b/gi, (_, digit) => {
    return TRIPLE_WORDS[digit.toLowerCase()] || digit;
  });

  // Convert individual number words
  const tokens = text.split(/\s+/);
  const mappedTokens = tokens.map((token) => {
    const cleaned = token.replace(/[^a-z0-9+]/g, '');
    return NUMBER_WORDS[cleaned] !== undefined ? NUMBER_WORDS[cleaned] : token;
  });
  const merged = mappedTokens.join(' ');

  // Extract digits and optional leading +
  const hasLeadingPlus = merged.trim().startsWith('+');
  const digitsOnly = merged.replace(/\D/g, '');

  if (!digitsOnly) return '';

  // If starts with 234 without + and length is 13, format with +234 or keep digits
  if (hasLeadingPlus) {
    return `+${digitsOnly}`;
  }

  return digitsOnly;
}

/**
 * Clean spoken names over gate noise.
 * Converts "my name is amina bello" -> "Amina Bello"
 * Strips filler words and capitalizes words.
 */
export function cleanVoiceName(transcript: string): string {
  if (!transcript) return '';

  let text = transcript.trim();

  // Strip conversational preambles
  text = text
    .replace(
      /^(my\s+name\s+is|the\s+name\s+is|name\s+is|this\s+is|his\s+name\s+is|her\s+name\s+is|i\s+am|it\s+is|it's)\s+/i,
      ''
    )
    .trim();

  // Strip trailing noise
  text = text.replace(/\s+(please|thanks|thank\s+you|alright|okay|bro|sir|ma)\.?$/i, '').trim();

  // Remove unwanted punctuation
  text = text.replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ' ');

  // Collapse spaces
  text = text.replace(/\s+/g, ' ').trim();

  // Title case each word
  return text
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Unified dispatch based on field type
 */
export function cleanVoiceInput(
  rawTranscript: string,
  fieldType: 'email' | 'phone' | 'name' | 'text'
): string {
  switch (fieldType) {
    case 'email':
      return cleanVoiceEmail(rawTranscript);
    case 'phone':
      return cleanVoicePhone(rawTranscript);
    case 'name':
      return cleanVoiceName(rawTranscript);
    default:
      return rawTranscript.trim();
  }
}
