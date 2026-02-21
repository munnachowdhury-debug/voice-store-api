const admin = require('firebase-admin');
const axios = require('axios');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  });
}

const db = admin.firestore();
const TRON_ADDRESS = 'TELRyMwDmdKzBRb7Uaw3zNvphrc8V3D5Mj';
const APP_ID = 'voice-store-real';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { invoiceId, email, amount } = req.body;

  try {
    const response = await axios.get(`https://apilist.tronscanapi.com/api/token_trc20/transfers?limit=20&start=0&direction=1&relatedAddress=${TRON_ADDRESS}`);
    const transfers = response.data.token_transfers;
    const expectedMicro = Math.round(amount * 1000000);

    const foundTx = transfers.find(tx => 
        tx.to_address === TRON_ADDRESS && 
        tx.tokenInfo.symbol === 'USDT' &&
        Math.abs(parseInt(tx.quant) - expectedMicro) < 10 
    );

    if (!foundTx) return res.status(400).json({ success: false, message: 'Payment not found.' });

    const txId = foundTx.transaction_id;
    const invoiceRef = db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('Store_Deposits').doc(invoiceId);
    const invoiceDoc = await invoiceRef.get();

    if (!invoiceDoc.exists || invoiceDoc.data().status === 'Approved') {
       return res.status(400).json({ success: false, message: 'Invalid or already approved.' });
    }

    const checkTxRef = await db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('Store_Deposits').where('txId', '==', txId).get();
    if (!checkTxRef.empty) return res.status(400).json({ success: false, message: 'TxID used.' });

    const userRef = db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('Store_Users').doc(email);
    
    await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const currentBalance = userDoc.exists ? (userDoc.data().balance || 0) : 0;
        transaction.update(invoiceRef, { status: 'Approved', txId: txId, completedAt: new Date().toISOString() });
        transaction.update(userRef, { balance: currentBalance + amount });
    });

    return res.status(200).json({ success: true, message: 'Verified!' });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
