import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { pollSirens } from './sirenPoller';
import { sendAlertNotifications } from './notifications';

admin.initializeApp();

export const checkSirens = functions
  .region('europe-west1')
  .pubsub.schedule('every 5 seconds')
  .onRun(async () => {
    const alert = await pollSirens();
    if (alert && alert.type !== 'none') {
      const db = admin.firestore();
      await db.doc('system/currentAlert').set({
        id: `alert-${Date.now()}`,
        type: alert.type,
        cities: alert.cities || [],
        timestamp: Date.now(),
        active: true,
      });
      await sendAlertNotifications(alert.cities || []);
    }
  });

export const clearAlert = functions
  .region('europe-west1')
  .pubsub.schedule('every 1 minutes')
  .onRun(async () => {
    const db = admin.firestore();
    const doc = await db.doc('system/currentAlert').get();
    if (!doc.exists) return;

    const data = doc.data();
    if (data && data.active && Date.now() - data.timestamp > 10 * 60 * 1000) {
      await db.doc('system/currentAlert').update({ active: false });
    }
  });

export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const db = admin.firestore();
  await db.doc(`users/${user.uid}`).set(
    {
      name: '',
      city: '',
      avatar: '😊',
      groupIds: [],
      createdAt: Date.now(),
    },
    { merge: true }
  );
});
