# מקלט ביחד — Shelter Together 🏠

משחקי מקלט קבוצתיים לזמן אזעקה. פותח בישראל, לישראלים.

---

## מה זה?

אפליקציית משחקים קבוצתית שמופעלת בזמן אזעקה. כל חברי הקבוצה מסמנים שהם במקום בטוח, ואז מתחיל משחק אקראי מתוך 8 מיני-משחקים חברתיים (סגנון משחקי קופסה).

**המשחקים:** מי אמר? · הסוכן הסודי · ציור וניחוש · בום! טריוויה · בלוף · קטגוריות · הצבעה · מילה אחת

---

## התקנה מהירה (5 דקות)

### דרישות מוקדמות

- [Node.js](https://nodejs.org/) גרסה 18 ומעלה
- חשבון [Firebase](https://firebase.google.com/) (חינמי)

### שלב 1: התקנת dependencies

```bash
cd frontend
npm install
```

### שלב 2: יצירת פרויקט Firebase

1. לכו ל-[Firebase Console](https://console.firebase.google.com/)
2. לחצו **Create a project** → תנו שם (למשל `shelter-together`) → Continue
3. כבו את Google Analytics (לא חובה) → Create Project

### שלב 3: הפעלת Authentication

1. בפרויקט ב-Firebase Console → לכו ל-**Build → Authentication**
2. לחצו **Get started**
3. בלשונית **Sign-in method** הפעילו **Anonymous** (תלחצו עליו → Enable → Save)

### שלב 4: יצירת Firestore Database

1. בפרויקט → לכו ל-**Build → Firestore Database**
2. לחצו **Create database**
3. בחרו **Start in test mode** → **Next**
4. בחרו location קרוב (למשל `europe-west1`) → **Enable**

### שלב 5: קבלת הגדרות Firebase

1. בפרויקט → לחצו על גלגל השיניים ⚙️ → **Project settings**
2. גללו למטה ל-**Your apps** → לחצו על **</>** (Web)
3. תנו שם (למשל `shelter-together-web`) → **Register app**
4. תראו קוד עם `firebaseConfig` — **העתיקו את הערכים**

### שלב 6: קובץ הגדרות

צרו קובץ `frontend/.env` עם הערכים מ-Firebase:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=shelter-together.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=shelter-together
VITE_FIREBASE_STORAGE_BUCKET=shelter-together.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### שלב 7: הרצה!

```bash
cd frontend
npm run dev
```

פתחו http://localhost:5173/ בדפדפן.

---

## שימוש בלי Firebase (מצב מקומי)

אם לא מגדירים את קובץ `.env`, האפליקציה רצה במצב מקומי — הכל שמור בזיכרון הדפדפן. מתאים לפיתוח ולבדיקה.

```bash
cd frontend
npm install
npm run dev
```

---

## דיפלוי (העלאה לאוויר)

### אפשרות 1: Firebase Hosting

```bash
# התקנת Firebase CLI
npm install -g firebase-tools

# התחברות
firebase login

# יצירת פרויקט (פעם אחת)
firebase init hosting
# → בחרו את הפרויקט שיצרתם
# → Public directory: frontend/dist
# → Single-page app: Yes
# → Overwrite index.html: No

# בנייה + העלאה
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

האפליקציה תהיה זמינה ב: `https://your-project.web.app`

### אפשרות 2: Vercel / Netlify

```bash
cd frontend
npm run build
```

העלו את תיקיית `frontend/dist` ל-Vercel או Netlify.

---

## אבטחה (לפני שעולים לפרודקשן)

החליפו את ה-Firestore Rules ב-Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /groups/{groupId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null
        && request.auth.uid in resource.data.members;
    }
    match /sessions/{sessionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    match /system/{docId} {
      allow read: if request.auth != null;
    }
  }
}
```

---

## מבנה הפרויקט

```
frontend/
├── src/
│   ├── App.tsx              # ראוטר ראשי
│   ├── firebase.ts          # חיבור Firebase
│   ├── lib/
│   │   ├── AuthContext.tsx   # ניהול משתמש
│   │   ├── localStore.ts    # מצב מקומי (בלי Firebase)
│   │   ├── gameDefinitions.ts # הגדרות 8 המשחקים
│   │   └── types.ts         # טיפוסים
│   ├── hooks/               # React hooks
│   ├── pages/               # דפים ראשיים
│   ├── components/          # רכיבים משותפים
│   └── games/               # 8 מיני-משחקים
│       ├── WhoSaidIt.tsx    # מי אמר?
│       ├── SecretAgent.tsx  # הסוכן הסודי
│       ├── DrawAndGuess.tsx # ציור וניחוש
│       ├── BoomTrivia.tsx   # בום! טריוויה
│       ├── Bluff.tsx        # בלוף
│       ├── Categories.tsx   # קטגוריות
│       ├── TheVote.tsx      # הצבעה
│       └── OneWord.tsx      # מילה אחת
└── functions/               # Firebase Cloud Functions (סירנה)
```

---

## אינטגרציה עם מערכת האזעקות

הפרויקט כולל Cloud Function שמתחברת ל-API של פיקוד העורף (`pikud-haoref-api`). כדי להפעיל:

```bash
cd functions
npm install
firebase deploy --only functions
```

> שימו לב: ה-API עובד רק משרת בישראל.

---

## טכנולוגיות

React · TypeScript · Vite · Tailwind CSS · Firebase · Framer Motion

---

בנוי באהבה, למען מי שצריך קצת אור בחושך. 🇮🇱
