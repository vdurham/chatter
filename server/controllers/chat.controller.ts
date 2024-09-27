// Controller serving the chat room page and handling the loading, posting, and update of chat messages
// Note that controllers don't access the DB direcly, only through the models

import Controller from './controller';
import { ILogin, IUser } from '../../common/user.interface';
import { User } from '../models/user.model';
import { ChatMessage } from '../models/chatMessage.model';
import { IChatMessage } from '../../common/chatMessage.interface';
import { NextFunction, Request, Response } from 'express';
import * as responses from '../../common/server.responses';
import jwt from 'jsonwebtoken';
import { JWT_KEY as secretKey } from '../env';

export default class ChatController extends Controller {
  public constructor(path: string) {
    super(path);
  }

  public initializeRoutes(): void {
    // this should define the routes handled by the middlewares chatRoomPage,
    // authenticate, getAllUsers, getUser, postMessage, and getAllMessages
    this.router.get('/', this.chatRoomPage);
    this.router.get('/messages', this.authorize, this.getAllMessages);
    this.router.post('/messages', this.authorize, this.postMessage);
    this.router.get('/users', this.authorize, this.getAllUsers);
    this.router.get('/usernames', this.authorize, this.getAllUsers);
    this.router.get('/users/:username', this.authorize, this.getUser);
    this.router.delete(
      '/users/:username',
      this.authorize,
      this.deleteUserAndMessages
    );
  }

  public chatRoomPage(req: Request, res: Response) {
    res.redirect('/chat.html');
  }

  public authorize(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      try {
        const decodedToken: ILogin = jwt.verify(token, secretKey) as ILogin;
        // Add the authorized user to the request object
        req.body = Object.assign(req.body, {
          authorizedUser: decodedToken.username
        });
        next();
      } catch (err) {
        const error: responses.IAppError = {
          type: 'ClientError',
          name: 'InvalidToken',
          message: 'Please log in to access this page.'
        };
        res.status(401).json(error);
      }
    } else {
      const error: responses.IAppError = {
        type: 'ClientError',
        name: 'MissingToken',
        message: 'Please log in to access this page.'
      };
      res.status(401).json(error);
    }
  }

  public async getAllUsers(req: Request, res: Response) {
    const users = await User.getAllUsers();
    if (users) {
      const usernames = users.map((user: IUser) => user.credentials.username);
      const successRes: responses.ISuccess = {
        name: 'UsersFound',
        message: 'Users retrieved successfully',
        payload: usernames
      };
      res.status(200).json(successRes);
    } else {
      const error: responses.IAppError = {
        type: 'ServerError',
        name: 'DBError',
        message: 'Users could not be retrieved.'
      };
      res.status(500).json(error);
    }
  }

  public async getUser(req: Request, res: Response) {
    const user = await User.findUser(req.params.username);
    if (!user) {
      const error: responses.IAppError = {
        type: 'ClientError',
        name: 'UserNotFound',
        message: `User ${user} does not exist.`
      };
      res.status(400).json(error);
    } else {
      const successRes: responses.ISuccess = {
        name: 'UserFound',
        message: 'User found successfully',
        payload: user
      };
      res.status(200).json(successRes);
    }
  }

  public async postMessage(req: Request, res: Response) {
    // Check for missing fields
    const missingFields: string[] = [];
    if (!req.body.author) {
      missingFields.push('author');
    }
    if (!req.body.text) {
      missingFields.push('text');
    }

    if (missingFields.length > 0) {
      const errname: responses.ClientErrorName = missingFields.includes(
        'author'
      )
        ? 'MissingAuthor'
        : 'MissingChatText';
      const err: responses.IAppError = {
        type: 'ClientError',
        name: errname,
        message: `The following fields are missing: ${missingFields.join(', ')}. Please re-enter the chat message.`
      };
      res.status(400).json(err);
      return;
    }

    try {
      const message = new ChatMessage(req.body.author, req.body.text);
      const postMessage = await message.post(req.body.authorizedUser);

      const successRes: responses.ISuccess = {
        name: 'ChatMessageCreated',
        message: 'Message posted successfully',
        payload: postMessage
      };
      // Broadcast the new message to all connected clients
      Controller.io.emit('newChatMessage', postMessage);

      res.status(201).json(successRes);
    } catch (err) {
      const appError = err as responses.IAppError;
      if (responses.isAppError(appError)) {
        res.status(401).json(err);
      } else {
        const error: responses.IAppError = {
          type: 'ServerError',
          name: 'DBError',
          message: 'Message could not be posted.'
        };
        res.status(500).json(error);
      }
      return;
    }
  }

  public async getAllMessages(req: Request, res: Response) {
    try {
      const messages = await ChatMessage.getAllChatMessages();
      const successRes: responses.ISuccess = {
        name:
          messages.length === 0 ? 'NoChatMessagesFound' : 'ChatMessagesFound',
        message: 'Messages retrieved successfully',
        payload: messages
      };
      res.status(200).json(successRes);
    } catch (err) {
      const appError = err as responses.IAppError;
      if (responses.isAppError(appError)) {
        res.status(400).json(err);
      } else {
        const error: responses.IAppError = {
          type: 'ServerError',
          name: 'DBError',
          message: 'Messages could not be retrieved.'
        };
        res.status(500).json(error);
      }
    }
  }

  public async deleteUserAndMessages(req: Request, res: Response) {
    const user = await User.findUser(req.params.username);
    if (!user) {
      const error: responses.IAppError = {
        type: 'ClientError',
        name: 'UserNotFound',
        message: `User ${req.params.username} does not exist.`
      };
      res.status(400).json(error);
    } else {
      const deletedMsgCnt = await ChatMessage.deleteChatMessages(
        req.params.username
      );
      const deletedUser = await User.deleteUser(req.params.username);
      if (deletedUser !== undefined && deletedMsgCnt !== undefined) {
        const successRes: responses.ISuccess = {
          name: 'UserDeleted',
          message: `User ${req.params.username} and ${deletedMsgCnt} messages deleted successfully`,
          payload: user
        };
        res.status(200).json(successRes);
      } else {
        const error: responses.IAppError = {
          type: 'ServerError',
          name: 'DBError',
          message: `User ${req.params.username} and their messages could not be deleted.`
        };
        res.status(500).json(error);
      }
    }
  }
}
