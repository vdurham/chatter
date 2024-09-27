// Controller serving pug pages

import Controller from './controller';
import { Request, Response } from 'express';
import { PORT, HOST, AUTHOR } from '../env';

export default class PugController extends Controller {
  public constructor(path: string) {
    super(path);
  }

  public initializeRoutes(): void {
    this.router.get('/about', this.aboutPage);
    this.router.get('/chat', this.chatRoomPage);
    this.router.get('/home', this.homePage);
    this.router.get('/friends', this.friendsPage);
    this.router.get('/auth', this.authPage);
    this.router.get('/', this.indexPage);
  }

  public indexPage(req: Request, res: Response): void {
    res.render('index');
  }

  public homePage(req: Request, res: Response): void {
    res.render('index');
  }

  public aboutPage(req: Request, res: Response): void {
    // Send the HTML response
    res.render('about', { HOST, PORT, AUTHOR });
  }

  public friendsPage(req: Request, res: Response) {
    res.render('friends');
  }

  public chatRoomPage(req: Request, res: Response) {
    res.render('chat');
  }

  public async authPage(req: Request, res: Response) {
    res.render('auth');
  }
}
