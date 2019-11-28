const admin = require('firebase-admin');
admin.initializeApp({
    credential: admin.credential.cert(require('../key/trashtalkAdminKey.json')),
    storageBucket: "trashtalk-245817.appspot.com"
});

const db = admin.firestore();

//export admin and db
module.exports = { admin, db };