import dotenv from 'dotenv';
import dns from 'dns';
import { MongoClient } from 'mongodb';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

let cachedGeo = null;

async function getMongoDBServerLocation(db) {
  if (cachedGeo) return cachedGeo;
  try {
    const hello = await db.command({ hello: 1 });
    const primaryHost = (hello.me || hello.primary || '').split(':')[0];
    const regionTag = hello.tags?.region || '';
    const providerTag = hello.tags?.provider || '';
    
    let locationStr = '';
    if (providerTag && regionTag) {
      locationStr = `${providerTag} ${regionTag}`;
    }

    if (primaryHost) {
      const addresses = await dns.promises.resolve4(primaryHost);
      if (addresses.length > 0) {
        const ip = addresses[0];
        const res = await fetch(`http://ip-api.com/json/${ip}`);
        if (res.ok) {
          const geo = await res.json();
          if (geo.status === 'success') {
            const cityCountry = `${geo.city}, ${geo.country}`;
            cachedGeo = {
              city: geo.city,
              country: geo.country,
              countryCode: geo.countryCode,
              regionName: geo.regionName,
              provider: providerTag || 'AWS',
              regionTag: regionTag,
              display: `${cityCountry} (${locationStr})`,
              ip: ip
            };
            return cachedGeo;
          }
        }
      }
    }

    cachedGeo = {
      display: locationStr || 'Global Cloud Node',
      provider: providerTag,
      regionTag: regionTag
    };
    return cachedGeo;
  } catch (err) {
    return { display: 'Global Cloud Node' };
  }
}

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DBNAME;
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 12000 });
  await client.connect();
  const db = client.db(dbName);
  const loc = await getMongoDBServerLocation(db);
  console.log('LOCATION RESULT:', loc);
  await client.close();
}

main();
