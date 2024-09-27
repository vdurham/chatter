// Controller serving the home page

import Controller from './controller';
import { Request, Response } from 'express';

export default class HomeController extends Controller {
  public constructor(path: string) {
    super(path);
  }

  // Just redirection going on here, nothing fancy
  // Plus a an about page generated on the fly

  public initializeRoutes(): void {
    this.router.get('/about', this.aboutPage);
    this.router.get('/home', this.homePage);
    this.router.get('/', this.indexPage);
  }

  public indexPage(req: Request, res: Response): void {
    res.redirect('/index.html');
  }

  public homePage(req: Request, res: Response): void {
    res.redirect('/');
  }

  public aboutPage(req: Request, res: Response): void {
    const hostname = req.hostname;
    const port = req.socket.localPort;

    // HTML to serve
    const aboutHTML = `
      <html>
        <head>
          <title>About Chatter</title>
        </head>
        <body>
          <h1>About Chatter</h1>
          <p>Chatter is running on ${hostname} at port ${port}.</p>
          <p>Chatter is an Express.js app built using TypeScript, HTML, and CSS.</p>
        </body>
      </html>
    `;

    // Send the HTML response
    res.send(aboutHTML);
  }
}
