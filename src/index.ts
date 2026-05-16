import { app } from './app.js';

const PORT = Number(process.env.PORT) || 5500;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
