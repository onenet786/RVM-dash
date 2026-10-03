import { MongoClient } from 'mongodb';
import pg from 'pg';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const { Pool } = pg;
const mongoUri = 'mongodb+srv://mcsrwp_db_user:8ctdZ%23TjEx%26N%25H4@cluster0.fuycg6c.mongodb.net/rvmapp?retryWrites=true&w=majority';
const pgPool = new Pool({ connectionString: 'postgresql://postgres:Admin786@127.0.0.1:5432/rvmpg' });

async function syncUsers() {
  console.log('Connecting to MongoDB rvmapp...');
  const client = await MongoClient.connect(mongoUri);
  const db = client.db('rvmapp');
  
  console.log('Fetching userprofile documents...');
  const userProfiles = await db.collection('userprofile').find({}).toArray();
  console.log(`Found ${userProfiles.length} userprofile records in MongoDB.`);

  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < userProfiles.length; i++) {
    const up = userProfiles[i];
    const rawMobile = (up.mobile || up.phone || '').trim();
    if (!rawMobile && !up.email && !up.username) continue;

    // Normalize phone (03xxxxxxxxx)
    let mobile = rawMobile;
    const cleanDigits = rawMobile.replace(/\D/g, '');
    if (cleanDigits.length === 11 && cleanDigits.startsWith('03')) {
      mobile = cleanDigits;
    } else if (cleanDigits.length === 12 && cleanDigits.startsWith('923')) {
      mobile = '0' + cleanDigits.slice(2);
    }

    const userId = 'USR-LEGACY-' + (up._id ? up._id.toString() : i);
    const rawUsername = (up.username || up.userName || (mobile ? `user_${mobile}` : `user_${i}`)).trim();
    // Ensure unique username
    let username = rawUsername;
    const fullName = (up.fullName || up.name || username).trim();
    let email = (up.email || '').trim().toLowerCase() || null;
    const password = up.password || '';
    const age = parseInt(up.age) || 20;
    const nic = up.nic || up.cnic || '';
    const gender = up.gender || 'male';
    const pointsBalance = parseInt(up.points || up.points_balance || up.balance || 0);
    const createdAt = up.createdAt ? new Date(up.createdAt) : new Date();

    // Check if user with this mobile, email, or username already exists
    const existing = await pgPool.query(`
      SELECT user_id, mobile, email, username FROM users
      WHERE (mobile IS NOT NULL AND mobile = $1)
         OR (email IS NOT NULL AND email = $2)
         OR username = $3
      LIMIT 1;
    `, [mobile, email, username]);

    if (existing.rows.length > 0) {
      const ex = existing.rows[0];
      await pgPool.query(`
        UPDATE users 
        SET password = $1,
            mobile = COALESCE(users.mobile, $2),
            points_balance = GREATEST(points_balance, $3),
            last_active = NOW()
        WHERE user_id = $4;
      `, [password, mobile, pointsBalance, ex.user_id]);
      updated++;
    } else {
      // Handle unique constraint collisions for username/email
      let attempts = 0;
      let ok = false;
      while (!ok && attempts < 5) {
        try {
          await pgPool.query(`
            INSERT INTO users (
              user_id, username, full_name, email, mobile, password, age, nic, gender,
              points_balance, status, role_id, created_at, user_type
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIVE', 'citizen', $11, 'CITIZEN');
          `, [userId, username, fullName, email, mobile, password, age, nic, gender, pointsBalance, createdAt]);
          inserted++;
          ok = true;
        } catch (insErr) {
          attempts++;
          if (insErr.code === '23505') { // unique violation
            if (insErr.constraint === 'users_username_key') {
              username = `${rawUsername}_${Math.floor(Math.random() * 9000 + 1000)}`;
            } else if (insErr.constraint === 'users_email_key') {
              email = null; // drop duplicate email
            } else {
              break;
            }
          } else {
            console.error(`Error inserting user ${mobile}:`, insErr.message);
            break;
          }
        }
      }
    }
  }

  console.log(`Sync completed! Inserted: ${inserted}, Updated: ${updated} users in PostgreSQL.`);
  await client.close();
  await pgPool.end();
}

syncUsers().catch(console.error);
