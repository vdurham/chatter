// This is the model for chat messages
// It is used by the controllers to access functionality related chat messages, including database access

import DAC from '../db/dac';
import { v4 as uuidV4 } from 'uuid';
import { IChatMessage } from '../../common/chatMessage.interface';
import { IUser } from '../../common/user.interface';
import { IAppError, IAuthenticatedUser } from '../../common/server.responses';
import { User } from './user.model';
import { isEmptyObject } from 'jquery';

export class ChatMessage implements IChatMessage {
  constructor(
    public author: string,
    public text: string,
    public displayName?: string,
    public timestamp?: string,
    public _id?: string
  ) {}

  async post(authorizedUser: string): Promise<IChatMessage> {
    // check if user exists in DB
    const user = await User.findUser(this.author);
    if (!user) {
      const error: IAppError = {
        type: 'ClientError',
        name: 'UserNotFound',
        message: `User ${this.author} does not exist. Orphaned messages are not allowed.`
      };
      throw error;
    }

    // username mismatch
    if (authorizedUser !== this.author) {
      const err: IAppError = {
        type: 'ClientError',
        name: 'UnauthorizedRequest',
        message:
          'You are not authorized to post this message. Posting a chat on behalf of another user is not allowed.'
      };
      throw err;
    }

    // create a new chat message
    const newMessage: IChatMessage = {
      author: this.author,
      text: this.text,
      displayName: user.extra,
      timestamp: new Date().toLocaleString('en-US', {
        timeZone: 'America/New_York'
      }),
      _id: uuidV4()
    };

    // Save the message to the database
    const savedMessage = await DAC.db.saveChatMessage(newMessage);
    return savedMessage;
  }

  static async getAllChatMessages(): Promise<IChatMessage[]> {
    const messages = await DAC.db.findAllChatMessages();
    return messages;
  }

  static async deleteChatMessages(
    username: string
  ): Promise<number | undefined> {
    const deletedMsgCnt = await DAC.db.deleteUserChatMessages(username);
    return deletedMsgCnt;
  }
}
