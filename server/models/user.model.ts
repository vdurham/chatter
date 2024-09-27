// This is the model for users
// It is used by the controllers to access functionality related users, including database access

import { ILogin, IUser } from '../../common/user.interface';
import { v4 as uuidV4 } from 'uuid';
import DAC from '../db/dac';
import { IAppError } from '../../common/server.responses';
import bcrypt from 'bcrypt';

export class User implements IUser {
  credentials: ILogin;

  extra?: string; // this carries the displayName of the user

  _id?: string;

  constructor(credentials: ILogin, extra?: string) {
    this.credentials = credentials;
    this.extra = extra;
  }

  async join(): Promise<IUser> {
    // Check if email is already being used
    const existingUser = await User.findUser(this.credentials.username);
    if (existingUser) {
      const err: IAppError = {
        type: 'ClientError',
        name: 'UserExists',
        message: `${this.credentials.username} is already registered. Please login or choose a different email.`
      };
      throw err;
    }

    // Check for strong password
    const errorsArr: string[] = User.validatePassword(this.credentials);
    if (errorsArr.length > 0) {
      const err: IAppError = {
        type: 'ClientError',
        name: 'WeakPassword',
        message: `Invalid password: ${errorsArr.join(' ')}`
      };
      throw err;
    }

    // User does not exist, so create a new user with the hashed password
    const hashedPassword = await bcrypt.hash(this.credentials.password, 10);

    const newUser: IUser = {
      credentials: {
        username: this.credentials.username,
        password: hashedPassword
      },
      extra: this.extra,
      _id: uuidV4()
    };

    // Save the user to the database
    const user = await DAC.db.saveUser(newUser);

    return user;
  }

  async login(): Promise<IUser> {
    // check if the user exists
    const user = await User.findUser(this.credentials.username);
    if (!user) {
      const error: IAppError = {
        type: 'ClientError',
        name: 'UserNotFound',
        message: `User ${this.credentials.username} does not exist. Please register first.`
      };
      throw error;
    }

    // if user exists, check if password matches
    const passwordMatch = await bcrypt.compare(
      this.credentials.password,
      user.credentials.password
    );
    if (!passwordMatch) {
      const error: IAppError = {
        type: 'ClientError',
        name: 'IncorrectPassword',
        message: 'Incorrect password.'
      };
      throw error;
    }
    // if password matches, successful and return user
    return user;
  }

  static validatePassword(credentials: ILogin): string[] {
    // Check for strong password
    const errors: string[] = [];

    if (credentials.password.length < 4) {
      errors.push('Password must be at least 4 characters long.');
    }
    if (!/[a-zA-Z]/.test(credentials.password)) {
      errors.push('Password must contain at least one letter character.');
    }
    if (!/\d/.test(credentials.password)) {
      errors.push('Password must contain at least one number character.');
    }
    if (!/[$%#@!*&~^+-]/.test(credentials.password)) {
      errors.push(
        'Password must contain at least one special character from the set: { "$", "%", "#", "@", "!", "*", "&", "~", "^", "-", "+" }.'
      );
    }
    if (!/^[a-zA-Z0-9$%#@!*&~^+-]+$/.test(credentials.password)) {
      errors.push(
        'Password cannot contain any other characters apart from letters, numbers, and special characters.'
      );
    }
    return errors;
  }

  static async findUser(username: string): Promise<IUser | null> {
    const user = await DAC.db.findUserByUsername(username);
    return user;
  }

  static async getAllUsers(): Promise<IUser[]> {
    const users = await DAC.db.findAllUsers();
    return users;
  }

  static async deleteUser(username: string): Promise<number | undefined> {
    const deletedUser = await DAC.db.deleteUserByUsername(username);
    return deletedUser;
  }
}
