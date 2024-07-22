import { PORT, SECRET_KEY } from '../constants/env.js';

export const config = {
  database: {},

  client: {},

  server: {
    port: PORT,
  },

  auth: {
    secretKey: SECRET_KEY,
  },
};
