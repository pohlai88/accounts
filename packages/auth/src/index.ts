export * from './types';
export * from './sod';

export const auth = {
  login: async (_email: string, _password: string) => {
    // TODO: Implement Supabase auth
    return { user: null, error: null };
  }
};
