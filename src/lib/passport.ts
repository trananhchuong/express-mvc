import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { username },
        include: { roles: { include: { role: true } } },
      });
      if (!user) return done(null, false, { message: 'Invalid credentials.' });
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return done(null, false, { message: 'Invalid credentials.' });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
    done(null, user ?? false);
  } catch (err) {
    done(err);
  }
});

export { passport };
