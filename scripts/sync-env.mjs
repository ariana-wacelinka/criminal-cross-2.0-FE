import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = process.cwd();
const envPath = resolve(projectRoot, '.env');
const outputPath = resolve(projectRoot, 'public', 'env.js');

const defaults = {
  API_BASE_URL: '/api',
  API_MOCK_MODE: 'true',
};

function parseEnv(content) {
  const parsed = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
  }
  return parsed;
}

const envValues = existsSync(envPath) ? parseEnv(readFileSync(envPath, 'utf8')) : {};
const apiBaseUrl = envValues.API_BASE_URL || defaults.API_BASE_URL;
const apiMockMode = (envValues.API_MOCK_MODE || defaults.API_MOCK_MODE).toLowerCase() === 'true';

const output = `window.__env = window.__env || {};\nwindow.__env.API_BASE_URL = ${JSON.stringify(apiBaseUrl)};\nwindow.__env.API_MOCK_MODE = ${apiMockMode};\n`;

writeFileSync(outputPath, output, 'utf8');
