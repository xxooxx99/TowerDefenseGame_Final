import express from 'express';

const router = express.Router();

export const registerHandler = router.post('/register', async (req, res) => {
  const { userId, password } = req.body;

  const isExistUser =
});
