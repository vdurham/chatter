// Controller serving the athentication page and handling user registration and login
// Note that controllers don't access the DB direcly, only through the models

import { ILogin, IUser } from '../../common/user.interface';
import { User } from '../models/user.model';
import Controller from './controller';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import * as responses from '../../common/server.responses';
import { validate } from 'uuid';
import { JWT_KEY as secretKey, JWT_EXP as tokenExpiry } from '../env';

export default class AuthController extends Controller {
  public constructor(path: string) {
    super(path);
  }

  public initializeRoutes(): void {
    // this should define the routes handled by the middlewares authPage, register, and login
    this.router.get('/', this.authPage);
    this.router.post('/users', this.register);
    this.router.post('/tokens/:username?', this.login);
  }

  public async authPage(req: Request, res: Response) {
    res.redirect('/auth.html');
  }

  public async register(req: Request, res: Response) {
    // Check for missing fields
    const missingFields: string[] = [];
    if (!req.body.credentials?.username) {
      missingFields.push('email');
    }
    if (!req.body.credentials?.password) {
      missingFields.push('password');
    }
    if (!req.body.extra) {
      missingFields.push('name');
    }

    if (missingFields.length > 0) {
      const errname: responses.ClientErrorName = missingFields.includes('email')
        ? 'MissingUsername'
        : missingFields.includes('password')
          ? 'MissingPassword'
          : 'MissingDisplayName';
      const err: responses.IAppError = {
        type: 'ClientError',
        name: errname,
        message: `The following fields are missing: ${missingFields.join(
          ', '
        )}.`
      };
      res.status(400).json(err);
      return;
    }

    const credentials: ILogin = {
      username: req.body.credentials.username,
      password: req.body.credentials.password
    };

    const user: User = new User(credentials, req.body.extra);

    // Try to add user -> need to access database
    let savedUser: IUser;
    try {
      savedUser = await user.join();
    } catch (err) {
      const appError = err as responses.IAppError;
      if (responses.isAppError(appError)) {
        res.status(400).json(err);
      } else {
        // handle other errors
      }
      return;
    }
    const successRes: responses.ISuccess = {
      name: 'UserRegistered',
      message: `User ${savedUser.credentials.username} created`,
      payload: savedUser
    };
    res.status(201).json(successRes);
  }

  public async login(req: Request, res: Response) {
    // Check for missing fields
    try {
      const missingFields: string[] = [];
      if (!req.params.username) {
        missingFields.push('email');
      }
      if (!req.body.password) {
        missingFields.push('password');
      }

      if (missingFields.length > 0) {
        const errname: responses.ClientErrorName = missingFields.includes(
          'email'
        )
          ? 'MissingUsername'
          : 'MissingPassword';
        const err: responses.IAppError = {
          type: 'ClientError',
          name: errname,
          message: `The following fields are missing: ${missingFields.join(
            ', '
          )}.`
        };
        res.status(400).json(err);
        return;
      }

      const credentials: ILogin = {
        username: req.params.username,
        password: req.body.password
      };

      const user: User = new User(credentials);
      let authenticatedUser: IUser;
      try {
        authenticatedUser = await user.login();
      } catch (err) {
        const appError = err as responses.IAppError;
        if (responses.isAppError(appError)) {
          res.status(400).json(err);
        }
        return;
      }

      const tokenPayload: ILogin = {
        username: authenticatedUser.credentials.username,
        password: authenticatedUser.credentials.password
      };

      let signedtoken: string;
      if (tokenExpiry === 'never') {
        signedtoken = jwt.sign(tokenPayload, secretKey);
      } else {
        signedtoken = jwt.sign(tokenPayload, secretKey, {
          expiresIn: tokenExpiry
        });
      }
      const successRes: responses.ISuccess = {
        name: 'UserAuthenticated',
        message: `User ${authenticatedUser.credentials.username} is authenticated`,
        payload: {
          //formatted as IAuthenticatedUser object
          user: authenticatedUser,
          token: signedtoken
        }
      };
      res.status(200).json(successRes);
    } catch (error) {
      const err: responses.IAppError = {
        type: 'ServerError',
        name: 'FailedAuthentication',
        message: 'An error occurred during login. Please try again later.'
      };
      res.status(500).json(err);
    }
  }
}
