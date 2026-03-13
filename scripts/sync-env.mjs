import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = process.cwd();
const envPath = resolve(projectRoot, '.env');
const outputPath = resolve(projectRoot, 'src', 'app', 'core', 'config', 'runtime-env.ts');

const defaults = {
  API_BASE_URL: '/api',
  API_MOCK_MODE: 'false',
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

const output = `export type RuntimeEnv = {\n  API_BASE_URL: string;\n  API_MOCK_MODE: boolean;\n};\n\nexport const runtimeEnv: RuntimeEnv = {\n  API_BASE_URL: ${JSON.stringify(apiBaseUrl)},\n  API_MOCK_MODE: ${apiMockMode},\n};\n`;

mkdirSync(resolve(projectRoot, 'src', 'app', 'core', 'config'), { recursive: true });
writeFileSync(outputPath, output, 'utf8');
