import * as admin from 'firebase-admin';

export async function sendAlertNotifications(cities: string[]): Promise<void> {
  const db = admin.firestore();

  let query: admin.firestore.Query = db.collection('users');
  if (cities.length > 0 && cities.length <= 30) {
    query = query.where('city', 'in', cities);
  }

  const snapshot = await query.get();
  const tokens: string[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.fcmToken) {
      tokens.push(data.fcmToken);
    }
  });

  if (tokens.length === 0) return;

  const batchSize = 500;
  for (let i = 0; i < tokens.length; i += batchSize) {
    const batch = tokens.slice(i, i + batchSize);
    await admin.messaging().sendEachForMulticast({
      tokens: batch,
      notification: {
        title: '🚨 אזעקה!',
        body: 'היכנסו למקלט ביחד — הזמן לשחק!',
      },
      data: {
        type: 'siren',
        cities: JSON.stringify(cities),
      },
      android: {
        priority: 'high',
        notification: { channelId: 'siren_alerts', sound: 'default' },
      },
      apns: {
        payload: {
          aps: { sound: 'default', badge: 1 },
        },
      },
    });
  }
}
