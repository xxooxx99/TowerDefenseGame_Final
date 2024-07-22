import express from 'express';
import { createServer } from 'http';

const app = express();
const server = createServer(app);

const PORT = 8080;

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸습니다.');
});
