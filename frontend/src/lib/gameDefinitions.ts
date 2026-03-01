import { GameDefinition, GameType } from './types';

export const GAME_DEFINITIONS: Record<GameType, GameDefinition> = {
  'who-said-it': {
    type: 'who-said-it',
    nameHe: 'מי אמר?',
    descriptionHe: 'ענו על שאלה מצחיקה בעילום שם — ונחשו מי כתב מה!',
    rulesHe: [
      'כל שחקן מקבל שאלה מצחיקה וכותב תשובה בעילום שם',
      'התשובות מוצגות אחת אחת',
      'כולם מצביעים — מי לדעתכם כתב את זה?',
      'נקודות על ניחוש נכון ועל הטעיית שחקנים אחרים',
    ],
    emoji: '🎭',
    minPlayers: 3,
    maxPlayers: 20,
  },
  'secret-agent': {
    type: 'secret-agent',
    nameHe: 'הסוכן הסודי',
    descriptionHe: 'כולם יודעים את המיקום חוץ מהמרגל — מצאו אותו!',
    rulesHe: [
      'כל השחקנים מקבלים כרטיס עם מיקום — חוץ מהמרגל',
      'שאלו שאלות כן/לא כדי לזהות את המרגל',
      'המרגל מנסה להשתלב ולגלות את המיקום',
      'בסוף — הצביעו מי לדעתכם המרגל!',
    ],
    emoji: '🕵️',
    minPlayers: 3,
    maxPlayers: 15,
  },
  'draw-and-guess': {
    type: 'draw-and-guess',
    nameHe: 'ציור וניחוש',
    descriptionHe: 'שחקן אחד מצייר — כולם מנחשים!',
    rulesHe: [
      'שחקן אחד מקבל מילה סודית ומצייר אותה',
      'שאר השחקנים רואים את הציור בזמן אמת',
      'מי שמנחש ראשון — מקבל הכי הרבה נקודות',
      'הצייר מתחלף כל סיבוב',
    ],
    emoji: '🎨',
    minPlayers: 3,
    maxPlayers: 15,
  },
  'boom-trivia': {
    type: 'boom-trivia',
    nameHe: 'בום! טריוויה',
    descriptionHe: 'ענו נכון כדי להעביר את הפצצה — לפני שהיא מתפוצצת!',
    rulesHe: [
      'פצצה עם טיימר עוברת בין השחקנים',
      'ענו נכון על שאלת טריוויה כדי להעביר את הפצצה הלאה',
      'טעיתם או שנגמר הזמן? בום! מפסידים חיים',
      'השחקן האחרון שנשאר — מנצח!',
    ],
    emoji: '💣',
    minPlayers: 2,
    maxPlayers: 20,
  },
  'bluff': {
    type: 'bluff',
    nameHe: 'בלוף',
    descriptionHe: 'כתבו תשובה מזויפת משכנעת — ונסו לא ליפול בבלוף של אחרים!',
    rulesHe: [
      'מוצגת עובדה מוזרה או שאלה עם תשובה אמיתית',
      'כל שחקן כותב תשובה מזויפת אבל משכנעת',
      'כל התשובות (כולל האמיתית) מוצגות מעורבבות',
      'הצביעו על מה שנראה לכם אמיתי — נקודות על ניחוש ועל בלוף!',
    ],
    emoji: '🃏',
    minPlayers: 3,
    maxPlayers: 15,
  },
  'categories': {
    type: 'categories',
    nameHe: 'קטגוריות',
    descriptionHe: 'אות + קטגוריות = מרוץ נגד הזמן!',
    rulesHe: [
      'מוגרלת אות ו-5 קטגוריות',
      'יש לכם 30 שניות למלא תשובה לכל קטגוריה',
      'תשובה ייחודית = 2 נקודות, תשובה כפולה = 1 נקודה',
      'אין תשובה? 0 נקודות. מי שצובר הכי הרבה מנצח!',
    ],
    emoji: '📝',
    minPlayers: 2,
    maxPlayers: 20,
  },
  'the-vote': {
    type: 'the-vote',
    nameHe: 'הצבעה',
    descriptionHe: 'מי בקבוצה הכי סביר ש...? הצביעו וגלו!',
    rulesHe: [
      'מוצגת שאלה כמו "מי הכי סביר ששורד באי בודד?"',
      'כל שחקן מצביע על מישהו מהקבוצה',
      'התוצאה נחשפת — מי קיבל הכי הרבה קולות?',
      'משחק חברתי טהור — בלי ניקוד, רק כיף!',
    ],
    emoji: '🗳️',
    minPlayers: 3,
    maxPlayers: 20,
  },
  'one-word': {
    type: 'one-word',
    nameHe: 'מילה אחת',
    descriptionHe: 'תנו רמז במילה אחת — ותקוו שכולם חושבים כמוכם!',
    rulesHe: [
      'שחקן אחד מקבל מילה סודית ונותן רמז של מילה אחת',
      'כל שאר השחקנים כותבים ניחוש של המילה הסודית',
      'נקודות למי שניחש נכון ולמי שניחש כמו הרוב',
      'ככל שחושבים יותר דומה — מנצחים יותר!',
    ],
    emoji: '💡',
    minPlayers: 3,
    maxPlayers: 15,
  },
};

export const ALL_GAME_TYPES: GameType[] = Object.keys(GAME_DEFINITIONS) as GameType[];

export function pickRandomGame(playerCount: number, exclude: GameType[] = []): GameType {
  const eligible = ALL_GAME_TYPES.filter(
    (t) =>
      !exclude.includes(t) &&
      playerCount >= GAME_DEFINITIONS[t].minPlayers &&
      playerCount <= GAME_DEFINITIONS[t].maxPlayers
  );
  if (eligible.length === 0) {
    return ALL_GAME_TYPES[Math.floor(Math.random() * ALL_GAME_TYPES.length)];
  }
  return eligible[Math.floor(Math.random() * eligible.length)];
}
