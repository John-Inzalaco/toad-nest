import fs from 'fs';
import path from 'path';

const PRISMA_FILE_PATH = path.join(
  __dirname,
  '..',
  'prisma',
  'dashboard.prisma',
);

const BIG_INT_MISMATCHES = {
  analytics_tokens: ['user_id'],
  countries: ['id'],
  oauth_access_grants: ['resource_owner_id'],
  oauth_access_tokens: ['resource_owner_id'],
  mcm_child_publishers: ['id'],
  mcm_gam_sites: ['id', 'site_id', 'mcm_child_publisher_id'],
  partner_offering_accounts: ['offering_id', 'partner_id'],
  psas: ['id'],
  playlists: ['id', 'site_id', 'user_id'],
  playlist_vidos: ['id', 'playlist_id', 'video_id'],
  revenue_reports: ['site_id'],
  site_slots: ['site_id'],
  sites: ['mcm_gam_site_id'],
  offerings: ['id'],
  video_chapters: ['video_id', 'id'],
  video_tracks: ['video_id', 'id'],
};

const RELATIONS_TO_ADD = {
  mcm_child_publishers: [`mcm_gam_sites   mcm_gam_sites[]`],
  mcm_gam_sites: [
    `mcm_child_publishers      mcm_child_publishers?   @relation(fields: [mcm_child_publisher_id], references: [id], onDelete: NoAction, onUpdate: NoAction)`,
  ],
  payees: [`sites      sites[]`],
  sites: [
    `site_users site_users[]`,
    `payees payees? @relation(fields: [payee_id], references: [id], onDelete: NoAction, onUpdate: NoAction)`,
  ],
  site_users: [
    `users      users?   @relation(fields: [user_id], references: [id], onDelete: NoAction, onUpdate: NoAction)`,
    `sites      sites?   @relation(fields: [site_id], references: [id], onDelete: NoAction, onUpdate: NoAction)`,
  ],
  users: [`site_users                      site_users[]`],
};

function isKeyOfObject<T extends object>(
  key: string | number | symbol,
  obj: T,
): key is keyof T {
  return key in obj;
}

/**
 * Swaps BigInt to Int in the schema.prisma file where there are mismatches
 * between foreign key types and the relation id type.
 */
async function fixPrismaFile() {
  const text = fs.readFileSync(path.join(PRISMA_FILE_PATH), 'utf8');

  const textAsArray = text.split('\n');
  const fixedText = [];
  let currentModelName: string | null = null;

  for (const line of textAsArray) {
    let fixedLine = line;
    // Are we at the start of a model definition
    const modelMatch = line.match(/^model (\w+) {$/);
    if (modelMatch) {
      currentModelName = modelMatch[1];
    } else {
      if (
        currentModelName &&
        isKeyOfObject(currentModelName, BIG_INT_MISMATCHES)
      ) {
        const fieldMatch = line.match(/\s\s(\w+)\s+(\w+)(\[\])?/);
        if (fieldMatch) {
          const fieldName = fieldMatch[1];
          if (BIG_INT_MISMATCHES[currentModelName].includes(fieldName)) {
            fixedText.push(line.replace('BigInt', 'Int'));
            continue;
          }
        }
      }
      if (
        currentModelName &&
        fixedLine === '}' &&
        isKeyOfObject(currentModelName, RELATIONS_TO_ADD)
      ) {
        fixedLine = `${RELATIONS_TO_ADD[currentModelName].join(
          '\n',
        )}\n${fixedLine}`;
      }
    }

    fixedText.push(fixedLine);
  }

  fs.writeFileSync(PRISMA_FILE_PATH, fixedText.join('\n'));
}

void fixPrismaFile();
