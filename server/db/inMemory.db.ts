// an InMemory version of the database that you can use in early-stage development
// It's not persistent, but can be used for testing and debugging
// It allows you to evolve your application in the absense of a real database

import { IDatabase } from './dac';
import { IChatMessage } from '../../common/chatMessage.interface';
import { IUser } from '../../common/user.interface';
import { INote } from '../../common/note.interface';
import { IAppError } from '../../common/server.responses';

export class InMemoryDB implements IDatabase {
  notes: INote[] = [];

  users: IUser[] = [];

  messages: IChatMessage[] = [];

  async connect(): Promise<void> {
    return Promise.resolve(); // No connection setup needed for in-memory database
  }

  async init(): Promise<void> {
    this.notes = []; // Clear notes array
    this.users = []; // Clear users array
    this.messages = []; // Clear messages array
    return Promise.resolve(); // Resolve after clearing data
  }

  async close(): Promise<void> {
    return Promise.resolve(); // No connection to close for in-memory database
  }

  async saveUser(user: IUser): Promise<IUser> {
    // TODO: must return a copy of the saved user
    this.users.push(user);
    return user;
  }

  async findUserByUsername(username: string): Promise<IUser | null> {
    const foundUser = this.users.find(
      (user) => user.credentials.username === username
    );
    return foundUser || null;
  }

  async findAllUsers(): Promise<IUser[]> {
    return this.users;
  }

  async saveChatMessage(message: IChatMessage): Promise<IChatMessage> {
    this.messages.push(message);
    return message;
  }

  async findChatMessageById(_id: string): Promise<IChatMessage | null> {
    const foundMessage = this.messages.find((message) => message._id === _id);
    return foundMessage || null;
  }

  async findAllChatMessages(): Promise<IChatMessage[]> {
    return this.messages;
  }

  async getAllNotes(): Promise<INote[]> {
    return this.notes;
  }

  async saveNote(note: INote): Promise<INote> {
    this.notes.push(note);
    return note;
  }

  async deleteUserByUsername(username: string): Promise<number> {
    const index = this.users.findIndex(
      (user) => user.credentials.username === username
    );
    if (index >= 0) {
      this.users.splice(index, 1);
      return 1;
    }
    return 0;
  }

  async deleteUserChatMessages(username: string): Promise<number> {
    let deletedCount = 0;
    for (let i = 0; i < this.messages.length; i++) {
      if (this.messages[i].author === username) {
        this.messages.splice(i, 1);
        deletedCount += 1;
        i--; // Decrement i to account for the removed element
      }
    }
    return deletedCount;
  }
}
