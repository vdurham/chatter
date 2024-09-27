import path from 'path';
import App from './app';

// import { MongoDB } from './db/mongo.db'; // for later
import { InMemoryDB } from './db/inMemory.db';
import { MongoDB } from './db/mongo.db';
import { PORT, HOST, STAGE, ENV } from './env';
import { DB_CONN_STR as dbURL } from './env';
import AuthController from './controllers/auth.controller';
import ChatController from './controllers/chat.controller';
import HomeController from './controllers/home.controller';
import FriendsController from './controllers/friends.controller';
import PugController from './controllers/pug.controller';
import HistoryController from './controllers/history.controller';

export const app = new App(
  [
    // TODO: Add initialized controllers here
    new AuthController('/auth'),
    new ChatController('/chat'),
    new FriendsController('/friends'),
    new HomeController('/'),
    new PugController('/pug'),
    new HistoryController('/history')
  ],
  {
    clientDir: path.join(__dirname, '../.dist/client'),
    /* 
      for now using an InMemoryDB instance, but later change the following so that
      if STAGE !== 'EARLY', a MongoDB instance new MongoDB(dbURL) is used...
    */
    db: STAGE === 'EARLY' ? new InMemoryDB() : new MongoDB(dbURL),
    port: PORT,
    host: HOST,
    url: `${HOST}${ENV === 'LOCAL' ? ':' + PORT.toString() : ''}`,
    initOnStart: STAGE === 'PROD' ? false : true
  }
);

app.listen();
