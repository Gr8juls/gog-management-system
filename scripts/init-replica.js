const { MongoClient } = require('mongodb');

async function main() {
  const uri = process.env.DATABASE_DIRECT_URL || 'mongodb://127.0.0.1:27017/?directConnection=true';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('[GOG] Connected to MongoDB.');

    const admin = client.db('admin');
    try {
      const status = await admin.command({ replSetGetStatus: 1 });
      console.log(`[GOG] Replica set '${status.set}' is already active.`);
    } catch {
      console.log("[GOG] Initiating replica set 'rs0'...");
      await admin.command({
        replSetInitiate: {
          _id: 'rs0',
          members: [{ _id: 0, host: '127.0.0.1:27017' }],
        },
      });
      console.log("[GOG] Replica set 'rs0' initialized successfully!");
    }
  } catch (err) {
    console.error('[GOG] Error initializing replica set:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
