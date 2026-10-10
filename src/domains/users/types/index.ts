export interface CreateGoogleUserInput {
  email: string;
  googleSubject: string;
  name?: string | null;
  avatarUrl?: string | null;
}

export interface CreatePasswordUserInput {
  email: string;
  passwordHash: string;
  name?: string | null;
}
