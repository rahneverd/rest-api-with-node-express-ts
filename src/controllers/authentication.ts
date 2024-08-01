import express from 'express';
import { createUser, getUserByEmail, getUserByUsername } from '../db/users';
import { authentication, random } from '../helpers';

export const register = async (req: express.Request, res: express.Response) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Missing required fields' }).end();
    }
    const existingUserByEmail = await getUserByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ error: 'Email already in use' }).end();
    }
    const existingUserByUsername = await getUserByUsername(username);
    if (existingUserByUsername) {
      return res.status(400).json({ error: 'Username already in use' }).end();
    }
    const salt = random();
    const user = await createUser({
      email,
      username,
      authentication: {
        salt,
        password: authentication(salt, password)
      }
    });
    return res.status(200).json(user).end();
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error }).end();
  }
};

export const login = async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields' }).end();
    }
    let user = await getUserByEmail(email).select(
      '+authentication.salt +authentication.password'
    );
    if (!user) {
      user = await getUserByUsername(email).select(
        '+authentication.salt +authentication.password'
      );
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' }).end();
      }
    }
    const expectedHash = authentication(
      user?.authentication?.salt || '',
      password
    );
    if (user?.authentication?.password !== expectedHash) {
      return res.status(403).json({ error: 'Invalid credentials' }).end();
    }
    const salt = random();
    user.authentication.sessionToken = authentication(
      salt,
      user._id.toString()
    );
    await user.save();
    res.cookie('MY-REST-API', user.authentication.sessionToken, {
      domain: 'localhost',
      path: '/'
    });
    res.status(200).json(user).end();
    return res.status(200).json({ token: user._id }).end();
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error }).end();
  }
};
