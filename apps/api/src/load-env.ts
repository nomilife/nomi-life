/**
 * Load .env before any other module.
 * Must be the first import in main.ts so process.env is set before Nest/AiService load.
 */
import { config } from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(__dirname, '..', '.env');
config({ path: envPath });
