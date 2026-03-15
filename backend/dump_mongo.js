import mongoose from 'mongoose';
import fs from 'fs';

mongoose.connect('mongodb+srv://nikhilnaraharisetti7_db_user:42A9kIWwj6M6J3Bd@cluster0.cenytzo.mongodb.net/?appName=Cluster0')
  .then(async () => {
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).limit(2).toArray();
    fs.writeFileSync('mongo_dump.json', JSON.stringify(users, null, 2));
    console.log("Dumped to mongo_dump.json");
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
