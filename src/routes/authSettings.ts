import express from 'express';
import db from '../db/index';
import { authSettings } from '../db/schema';
import { eq } from 'drizzle-orm';
import logger from '../utils/logger';

const router = express.Router();

let cachedAuthSettings: any = null;

router.get('/', async (_, res) => {
  try {
    if (cachedAuthSettings) {
      return res.status(200).json(cachedAuthSettings);
    }

    const settings = await db.select().from(authSettings).limit(1);
    cachedAuthSettings = settings[0] || { isEnabled: false };
    res.status(200).json(cachedAuthSettings);
  } catch (err: any) {
    logger.error(`Error getting auth settings: ${err.message}`);
    res.status(500).json({ message: 'An error occurred while fetching auth settings.' });
  }
});

router.post('/', async (req, res) => {
  const { isEnabled, username, password } = req.body;

  try {
    const existingSettings = await db.select().from(authSettings).limit(1);

    if (existingSettings.length > 0) {
      await db.update(authSettings)
        .set({ isEnabled, username, password })
        .where(eq(authSettings.id, existingSettings[0].id));
    } else {
      await db.insert(authSettings).values({ isEnabled, username, password });
    }

    cachedAuthSettings = { isEnabled, username, password };
    res.status(200).json({ message: 'Auth settings updated successfully.' });
  } catch (err: any) {
    logger.error(`Error updating auth settings: ${err.message}`);
    res.status(500).json({ message: 'An error occurred while updating auth settings.' });
  }
});

export default router;