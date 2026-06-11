const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.cleanExpiredLocks = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();
  const locksRef = db.collection('locks');

  const snapshot = await locksRef.where('expiresAt', '<=', now).get();
  if (snapshot.empty) {
    console.log('No expired locks found.');
    return null;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`Deleted ${snapshot.size} expired locks.`);
  return null;
});
