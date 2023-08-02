import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const TEMPLATES_DIRECTORY = path.resolve(__dirname, '../src/emails/templates');

async function run() {
  const files = await fs.readdir(TEMPLATES_DIRECTORY);
  for (const fileName of files) {
    const filePath = path.resolve(TEMPLATES_DIRECTORY, fileName);
    const outputFilePath = path.resolve(
      __dirname,
      `../src/emails/compiled/${fileName}.js`,
    );

    execSync(
      `handlebars "${filePath}" -f "${outputFilePath}" -c handlebars/runtime`,
    );
  }
}

void run();
