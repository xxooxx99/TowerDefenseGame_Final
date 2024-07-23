import express from 'express';

const router = express.Router();

export const registerHandler = router.post('/register', async (req, res) => {});

// app.post('/api/register', async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     const existingUser = await prisma.user.findUnique({
//       where: {
//         userId: username,
//       },
//     });

//     if (existingUser) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newUser = await prisma.user.create({
//       data: {
//         userId: username,
//         userPassword: hashedPassword,
//       },
//     });

//     const token = jwt.sign({ id: newUser.userId }, JWT_SECRET, {
//       expiresIn: '1h',
//     });
//     res.status(201).json({ token });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });
