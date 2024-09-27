export interface IChatMessage {
  author: string; // author's username, contains the email provided by the user
  text: string; // contents of the chat message
  displayName?: string;
  timestamp?: string;
  _id?: string; // unique id of the chat message
}
