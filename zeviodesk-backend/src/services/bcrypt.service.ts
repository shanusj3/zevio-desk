import bcrypt from "bcrypt";

export const bcryptService = {
  hash: async (password: string, rounds = 12): Promise<string> => {
    return bcrypt.hash(password, rounds);
  },

  compare: async (password: string, storedHash: string): Promise<boolean> => {
    return bcrypt.compare(password, storedHash);
  },
};
