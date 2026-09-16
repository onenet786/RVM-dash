const { MongoClient } = require('mongodb');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const uri = 'mongodb+srv://mcsrwp_db_user:8ctdZ%23TjEx%26N%25H4@cluster0.fuycg6c.mongodb.net/rvmapp?retryWrites=true&w=majority';

async function checkMongo() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB rvmapp!');
    const db = client.db('rvmapp');
    const cols = await db.listCollections().toArray();
    console.log('Collections in rvmapp:', cols.map(c => c.name));

    // Look for user
    const usersCol = db.collection('users');
    const u = await usersCol.findOne({
      $or: [
        { phoneNumber: /03023274949/ },
        { mobile: /03023274949/ },
        { username: /03023274949/ },
        { userId: /03023274949/ },
        { phoneNumber: /3023274949/ }
      ]
    });
    console.log('User found in rvmapp.users:', u);

    // Look for recyclingsessions
    const recCol = db.collection('recyclingsessions');
    const recs = await recCol.find({
      $or: [
        { phoneNumber: /3023274949/ },
        { userId: /3023274949/ },
        { userName: /3023274949/ },
        { user_id: /3023274949/ }
      ]
    }).toArray();
    console.log('Recycling sessions found in rvmapp.recyclingsessions:', recs.length);
    if (recs.length > 0) {
      console.log('Sample session:', recs[0]);
    }

    // Look for redemptions
    const redCol = db.collection('redemptions');
    const reds = await redCol.find({
      $or: [
        { phoneNumber: /3023274949/ },
        { userId: /3023274949/ },
        { userName: /3023274949/ }
      ]
    }).toArray();
    console.log('Redemptions found in rvmapp.redemptions:', reds.length);

  } catch (err) {
    console.error('Mongo error:', err);
  } finally {
    await client.close();
  }
}

checkMongo();
