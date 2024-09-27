// dao = Data Access Object
// This is the access point to the database
// It is used to decouple the database from the rest of the application
// It is accessed by the models, which are used by the controllers

import { IChatMessage } from '../../common/chatMessage.interface';
import { IUser } from '../../common/user.interface';
import { INote } from '../../common/note.interface';

export interface IDatabase {
  connect(): Promise<void>;

  init(): Promise<void>;

  close(): Promise<void>;

  saveUser(userData: IUser): Promise<IUser>;

  findUserByUsername(username: string): Promise<IUser | null>;

  findAllUsers(): Promise<IUser[]>;

  findAllChatMessages(): Promise<IChatMessage[]>;

  findChatMessageById(_id: string): Promise<IChatMessage | null>;

  saveChatMessage(message: IChatMessage): Promise<IChatMessage>;

  deleteUserByUsername(username: string): Promise<number | undefined>;

  deleteUserChatMessages(username: string): Promise<number | undefined>;

  saveNote(noteData: INote): Promise<INote>;

  getAllNotes(): Promise<INote[]>;
}

/* Data Access Class */
class DAC {
  static _db: IDatabase;

  static get db(): IDatabase {
    return DAC._db;
  }

  static set db(db: IDatabase) {
    DAC._db = db;
  }
}

export default DAC;
