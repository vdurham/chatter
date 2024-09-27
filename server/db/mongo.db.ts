// This is the real database, using MongoDB and Mongoose
// It can be initialized with a MongoDB URL pointing to a production or development/test database

import { IDatabase } from './dac';
import mongoose from 'mongoose';
import { Schema, model, Document } from 'mongoose';
import { IUser } from '../../common/user.interface';
import { IChatMessage } from '../../common/chatMessage.interface';
import { INote } from '../../common/note.interface';
import { IAppError } from '../../common/server.responses';
import { STAGE, DB_CONN_STR } from '../env';

const UserSchema = new Schema<IUser>({
  credentials: {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
  },
  extra: { type: String, required: false },
  _id: { type: String, required: true }
});

const ChatMessageSchema = new Schema<IChatMessage>({
  author: { type: String, required: true },
  text: { type: String, required: true },
  displayName: { type: String, required: false },
  timestamp: { type: String, required: true },
  _id: { type: String, required: true }
});

const NoteSchema = new Schema<INote>({
  description: { type: String, required: true },
  date: { type: String, required: true },
  _id: { type: String, required: true } // required in DB
});

const MUser = model<IUser>('User', UserSchema);

const MChatMessage = model<IChatMessage>('Message', ChatMessageSchema);

const MNote = model<INote>('Note', NoteSchema);

export class MongoDB implements IDatabase {
  public dbURL: string;

  private db: mongoose.Connection | undefined;

  constructor(dbURL: string) {
    this.dbURL = DB_CONN_STR;
  }

  async connect(): Promise<void> {
    try {
      await mongoose.connect(this.dbURL);
      console.log('Connected to MongoDB');
      this.db = mongoose.connection;
    } catch (error) {
      console.error('Error connecting to MongoDB: ', error);
    }
  }

  async init(): Promise<void> {
    if (STAGE === 'PROD') {
      throw new Error('PROD! Do not use this method in production!');
    } else {
      if (this.db == undefined) throw new Error('MongoDB is undefined');
      const collections = this.db.collections;
      for (const index in collections) {
        await collections[index].deleteMany({});
      }
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  }

  async saveUser(user: IUser): Promise<IUser> {
    const newUser = new MUser(user);
    const savedUser = await newUser.save();
    return savedUser;
  }

  async findUserByUsername(username: string): Promise<IUser | null> {
    const user: IUser | null = await MUser.findOne({
      'credentials.username': username
    }).exec();
    return user;
  }

  async findAllUsers(): Promise<IUser[]> {
    const users: IUser[] = await MUser.find({}).exec();
    return users;
  }

  async deleteUserByUsername(username: string): Promise<number> {
    const deleted = await MUser.deleteOne({
      'credentials.username': username
    }).exec();
    return deleted.deletedCount;
  }

  async saveChatMessage(message: IChatMessage): Promise<IChatMessage> {
    const newMessage = new MChatMessage(message);
    const savedMessage = await newMessage.save();
    return savedMessage;
  }

  async findAllChatMessages(): Promise<IChatMessage[]> {
    const messages: IChatMessage[] = await MChatMessage.find({}).exec();
    return messages;
  }

  async findChatMessageById(_id: string): Promise<IChatMessage | null> {
    const message: IChatMessage | null = await MChatMessage.findOne({
      _id: _id
    }).exec();
    return message;
  }

  async deleteUserChatMessages(username: string): Promise<number> {
    const deleted = await MChatMessage.deleteMany({ author: username }).exec();
    return deleted.deletedCount;
  }

  async saveNote(note: INote): Promise<INote> {
    const newNote = new MNote(note);
    const savedNote: INote = await newNote.save();
    return savedNote;
  }

  async getAllNotes(): Promise<INote[]> {
    const notes = await MNote.find({}).exec();
    return notes;
  }
}
