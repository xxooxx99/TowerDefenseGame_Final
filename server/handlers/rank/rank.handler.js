import express from 'express';
import { userTop10 } from '../../models/rank.js';

const router = express.Router();

export const getRankList = router.get('/rank', async (req, res) => {
  try {
    res.status(200).json({ status: 'success', data: userTop10 });
  } catch (err) {
    console.error(e);
    res.status(500).json({ message: 'Internal server error' });
  }
});
