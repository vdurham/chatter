// Controller serving the home page

import Controller from './controller';
import { Request, Response } from 'express';
import { INote } from '../../common/note.interface';
import { Note } from '../models/note.model';
import { ISuccess, IAppError } from '../../common/server.responses';

export default class HistoryController extends Controller {
  public constructor(path: string) {
    super(path);
  }

  public initializeRoutes(): void {
    this.router.get('/notes', this.getNotes);
    this.router.post('/notes', this.addNote);
  }

  public async getNotes(req: Request, res: Response): Promise<void> {
    try {
      const notes: INote[] = await Note.getAllNotes();
      const body: ISuccess = {
        name: notes.length == 0 ? 'NoNotesFound' : 'NotesFound',
        payload: notes
      };
      res.status(200).json(body);
    } catch (error) {
      const err: IAppError = {
        type: 'ServerError',
        name: 'DBError',
        message: 'Error retrieving notes'
      };
      res.status(500).json(err);
    }
  }

  public async addNote(req: Request, res: Response): Promise<void> {
    if (!req.body.description || !req.body.date) {
      const err: IAppError = {
        type: 'ClientError',
        name: 'MissingNoteInfo',
        message: !req.body.description
          ? 'Request body for a new note must contain a description'
          : 'Request body for a new note must contain a date'
      };
      res.status(400).json(err);
      return; // required here
    }
    const note: Note = new Note(req.body.description, req.body.date);
    let savedNote: INote;
    try {
      savedNote = await note.save();
    } catch (error) {
      const err: IAppError = {
        type: 'ServerError',
        name: 'DBError',
        message: 'Error saving the note'
      };
      res.status(500).json(err);
      return;
    }
    const body: ISuccess = {
      name: 'NoteCreated',
      payload: savedNote
    };
    res.status(201).json(body);
  }
}
