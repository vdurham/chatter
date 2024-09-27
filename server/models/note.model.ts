// This is the model for history notes
// It is used by the controllers to access functionality related history notes, including database access

import DAC from '../db/dac';
import { INote } from '../../common/note.interface';
import { IAppError } from '../../common/server.responses';

export class Note implements INote {
  constructor(
    public description: string,
    public date: string
  ) {}

  async save(): Promise<INote> {
    return DAC.db.saveNote(this);
  }

  static async getAllNotes(): Promise<INote[]> {
    return DAC.db.getAllNotes();
  }
}
