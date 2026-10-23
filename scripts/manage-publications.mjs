#!/usr/bin/env node

import {
  copyFile,
  cp,
  mkdir,
  readFile,
  rm,
  stat,
} from 'node:fs/promises';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';
import { validatePublicationAuthors } from '../src/data/publication-authors.js';
import { publicationGroupDefinitions, publicationTypes } from '../src/data/publication-groups.js';
import {
  localResourceFiles,
  publicationsPath,
  scanPublications,
  syncPublications,
  writePublication,
} from './lib/publications.mjs';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const sitePath = path.join(projectRoot, 'content/site.json');
const publicationsRoot = publicationsPath(projectRoot);
const backupsRoot = path.join(projectRoot, 'publication-backups');
const siteContent = JSON.parse(await readFile(sitePath, 'utf8'));
const selfName = siteContent.owner.publicationName;
const publicationTypeLabels = Object.freeze(Object.fromEntries(
  publicationGroupDefinitions.map(({ type, heading }) => [type, heading]),
));
const resourceLabels = Object.freeze({
  pdf: 'PDF',
  code: 'Code',
  poster: 'Poster',
  bib: 'BibTeX',
});

function isWebUrl(value) {
  return /^https?:\/\//i.test(value);
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 56);
}

function parseAuthors(value) {
  return value.split(/[,，;]/).map((author) => author.trim()).filter(Boolean);
}

function inferredYear(venueShort) {
  return venueShort.match(/\b(?:19|20)\d{2}\b/)?.[0] || '';
}

async function isFile(filePath) {
  return (await stat(filePath).catch(() => null))?.isFile() || false;
}

async function readCatalog() {
  return (await scanPublications(projectRoot)).records;
}

async function ask(terminal, label, {
  current,
  required = false,
  validate,
} = {}) {
  while (true) {
    const suffix = current !== undefined && current !== '' ? ` [${current}]` : '';
    const value = (await terminal.question(`${label}${suffix}: `)).trim();
    const resolved = value || (current !== undefined ? String(current) : '');
    if (required && !resolved) {
      console.log('  此项不能为空。');
      continue;
    }
    const validationError = validate?.(resolved);
    if (validationError) {
      console.log(`  ${validationError}`);
      continue;
    }
    return resolved;
  }
}

async function askResource(terminal, key, publicationId, existing) {
  const filename = localResourceFiles[key];
  const localPath = path.join(publicationsRoot, publicationId, filename);
  const hasLocal = await isFile(localPath);
  const current = existing?.resources?.[key] || (hasLocal ? `本地文件 ${filename}` : '无');

  while (true) {
    const value = (await terminal.question(
      `${resourceLabels[key]}（URL/本地路径；留空保持，输入 - 删除） [${current}]: `,
    )).trim();
    if (!value) return { mode: 'keep' };
    if (value === '-') return { mode: 'remove' };
    if (isWebUrl(value)) return { mode: 'external', value };

    const source = path.resolve(process.cwd(), value);
    if (!(await isFile(source))) {
      console.log(`  找不到文件：${source}`);
      continue;
    }
    if (key === 'bib') {
      const bib = (await readFile(source, 'utf8')).trim();
      if (!bib.startsWith('@')) {
        console.log('  BibTeX 文件必须以 @ 开头。');
        continue;
      }
    }
    return { mode: 'local', source };
  }
}

async function collectTeamCredit(terminal, authors, existing) {
  const mode = await ask(terminal, '作者显示方式（list 为作者列表，team 为团队署名）', {
    current: existing?.authorCredit ? 'team' : 'list',
    required: true,
    validate: (value) => ['list', 'team'].includes(value) ? null : '请选择 list 或 team。',
  });
  if (mode === 'list') return null;
  const requireAuthor = (value) => authors.includes(value) ? null : '请填写完整作者列表中已有的姓名或团队名。';
  const team = await ask(terminal, '团队名称', {
    current: existing?.authorCredit?.team || authors[0], required: true, validate: requireAuthor,
  });
  const role = await ask(terminal, '个人贡献（例如 Core contributor）', {
    current: existing?.authorCredit?.role || 'Core contributor', required: true,
  });
  const name = await ask(terminal, '个人姓名', {
    current: existing?.authorCredit?.name || selfName, required: true, validate: requireAuthor,
  });
  return { team, role, name };
}

async function collectPublication(terminal, catalog, existing = null) {
  console.log('\n留空会保留方括号中的值。作者按论文顺序用逗号分隔。\n');
  const title = await ask(terminal, '标题', { current: existing?.title, required: true });
  const id = existing?.id || await ask(terminal, 'ID（小写字母、数字和连字符）', {
    current: slugify(title) || `paper-${Date.now()}`,
    required: true,
    validate(value) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) return 'ID 格式不正确。';
      if (catalog.some((publication) => publication.id === value)) return '该 ID 已存在。';
      return null;
    },
  });
  if (existing) console.log(`ID（编辑时固定）: ${id}`);
  const authorsText = await ask(terminal, '作者', {
    current: existing?.authors?.join(', '),
    required: true,
    validate(value) {
      const authors = parseAuthors(value);
      if (!authors.length) return '至少需要一位作者。';
      if (!authors.includes(selfName)) return `作者列表必须包含 ${selfName}，网页会自动为其添加下划线。`;
      return null;
    },
  });
  const authors = parseAuthors(authorsText);
  const firstAuthorCountText = await ask(terminal, '从第一位开始的第一作者人数（>1 表示共同一作）', {
    current: existing?.firstAuthorCount ?? 1,
    required: true,
    validate(value) {
      const count = Number(value);
      if (!Number.isInteger(count) || count < 1 || count > authors.length) {
        return `请输入 1 到 ${authors.length} 之间的整数。`;
      }
      return null;
    },
  });
  const authorCredit = await collectTeamCredit(terminal, authors, existing);
  const displayCountText = authorCredit ? String(authors.length) : await ask(terminal, '网页显示前几位作者（其余显示为 et al.）', {
    current: existing?.authorDisplayCount ?? authors.length,
    required: true,
    validate(value) {
      const count = Number(value);
      return Number.isInteger(count) && count >= 1 && count <= authors.length
        ? null : `请输入 1 到 ${authors.length} 之间的整数。`;
    },
  });
  const noteCountText = authorCredit ? '0' : await ask(terminal, '作者备注条数（共同一作说明自动生成，0 表示无其他备注）', {
    current: existing?.authorNotes?.length ?? 0,
    required: true,
    validate: (value) => Number.isInteger(Number(value)) && Number(value) >= 0
      ? null : '请输入非负整数。',
  });
  const authorNotes = [];
  const usedSymbols = new Set(Number(firstAuthorCountText) > 1 ? ['*'] : []);
  for (let index = 0; index < Number(noteCountText); index += 1) {
    const existingNote = existing?.authorNotes?.[index];
    const symbol = await ask(terminal, `备注 ${index + 1} 的符号（例如 † 或 ‡）`, {
      current: existingNote?.symbol,
      required: true,
      validate: (value) => usedSymbols.has(value) ? '该符号已使用，请选择其他符号。' : null,
    });
    usedSymbols.add(symbol);
    const text = await ask(terminal, `备注 ${index + 1} 的英文说明`, {
      current: existingNote?.text,
      required: true,
    });
    const markedAuthors = await ask(terminal, `备注 ${index + 1} 的适用作者（完整姓名，逗号分隔）`, {
      current: existingNote?.authors?.join(', '),
      required: true,
      validate(value) {
        const names = parseAuthors(value);
        return names.length && names.every((name) => authors.includes(name))
          ? null : '请填写作者列表中已有的完整姓名。';
      },
    });
    authorNotes.push({ symbol, text, authors: parseAuthors(markedAuthors) });
  }
  const type = await ask(terminal, `论文类型（${publicationTypes.join('/')}）`, {
    current: existing?.type,
    required: true,
    validate(value) {
      return Object.hasOwn(publicationTypeLabels, value)
        ? null
        : `请选择 ${publicationTypes.join('、')}。`;
    },
  });
  const venue = await ask(terminal, '完整发表信息（不要包含 In:）', {
    current: existing?.venue,
    required: true,
    validate(value) {
      return /^\s*In\s*:/i.test(value) ? '请删除开头的 In:，网页会自动添加。' : null;
    },
  });
  const venueShort = await ask(terminal, '发表缩写（例如 ICML 2026）', {
    current: existing?.venueShort,
    required: true,
  });
  const year = await ask(terminal, '年份', {
    current: existing?.year || inferredYear(venueShort),
    required: true,
    validate: (value) => /^\d{4}$/.test(value) ? null : '年份需要是四位数字。',
  });
  const official = await ask(terminal, '论文官方页面 URL（可选，输入 - 清除）', {
    current: existing?.resources?.official || '',
    validate: (value) => !value || value === '-' || isWebUrl(value) ? null : '请输入 http(s) URL。',
  });
  const summary = await ask(terminal, 'TL;DR', {
    current: existing?.summary,
    required: true,
  });

  const resourceChanges = {};
  for (const key of Object.keys(resourceLabels)) {
    resourceChanges[key] = await askResource(terminal, key, id, existing);
  }
  const resources = { ...(existing?.resources || {}) };
  if (official && official !== '-') resources.official = official;
  else delete resources.official;
  for (const [key, change] of Object.entries(resourceChanges)) {
    if (change.mode === 'external') resources[key] = change.value;
    if (change.mode === 'local' || change.mode === 'remove') delete resources[key];
  }

  const record = {
    ...(existing || {}),
    id,
    type,
    title,
    authors,
    firstAuthorCount: Number(firstAuthorCountText),
    venue,
    venueShort,
    year,
    summary,
    resources,
  };
  delete record.authorDisplayCount;
  delete record.authorNotes;
  delete record.authorCredit;
  if (Number(displayCountText) < authors.length) {
    record.authorDisplayCount = Number(displayCountText);
  }
  if (authorNotes.length) record.authorNotes = authorNotes;
  if (authorCredit) record.authorCredit = authorCredit;
  validatePublicationAuthors(record);
  return { record, resourceChanges };
}

async function createBackup(publicationId) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDirectory = path.join(backupsRoot, `${timestamp}-${publicationId}`);
  await mkdir(backupDirectory, { recursive: true });
  await cp(path.join(publicationsRoot, publicationId), backupDirectory, { recursive: true });
  return backupDirectory;
}

async function applyResourceChanges(publicationId, changes) {
  const publicationDirectory = path.join(publicationsRoot, publicationId);
  for (const [key, change] of Object.entries(changes)) {
    if (change.mode === 'keep') continue;
    const target = path.join(publicationDirectory, localResourceFiles[key]);
    if (change.mode === 'remove' || change.mode === 'external') {
      await rm(target, { force: true });
      continue;
    }
    await mkdir(publicationDirectory, { recursive: true });
    await copyFile(change.source, target);
  }
}

function printPublications(catalog) {
  if (!catalog.length) {
    console.log('\n当前没有论文。\n');
    return;
  }
  console.log('');
  catalog.forEach((publication, index) => {
    const coFirst = publication.firstAuthorCount > 1
      ? `；前 ${publication.firstAuthorCount} 位共同一作`
      : '';
    console.log(`${index + 1}. ${publication.title}`);
    console.log(`   ID: ${publication.id}`);
    console.log(`   Type: ${publicationTypeLabels[publication.type] || publication.type}`);
    console.log(`   ${publication.authors.join(', ')}${coFirst}`);
    if (publication.authorCredit) {
      const { team, role, name } = publication.authorCredit;
      console.log(`   网页署名：${team} (${role}: ${name})`);
    }
    if (publication.authorDisplayCount < publication.authors.length) {
      console.log(`   网页显示前 ${publication.authorDisplayCount} 位作者，其余在 et al. 悬浮窗中显示`);
    }
    publication.authorNotes?.forEach((note) => {
      console.log(`   ${note.symbol} ${note.text} (${note.authors.join(', ')})`);
    });
    console.log(`   ${publication.venueShort} · ${publication.year}`);
  });
  console.log('');
}

async function choosePublication(terminal, catalog, requestedId) {
  if (!catalog.length) throw new Error('当前没有可管理的论文。');
  if (requestedId) {
    const publication = catalog.find(({ id }) => id === requestedId);
    if (!publication) throw new Error(`找不到论文 ID：${requestedId}`);
    return publication;
  }
  printPublications(catalog);
  const selected = await ask(terminal, '输入论文编号或 ID', { required: true });
  const byIndex = Number(selected);
  const publication = Number.isInteger(byIndex) && byIndex >= 1 && byIndex <= catalog.length
    ? catalog[byIndex - 1]
    : catalog.find(({ id }) => id === selected);
  if (!publication) throw new Error(`找不到论文：${selected}`);
  return publication;
}

async function addPublication(terminal) {
  const catalog = await readCatalog();
  const { record, resourceChanges } = await collectPublication(terminal, catalog);
  await mkdir(publicationsRoot, { recursive: true });
  await mkdir(path.join(publicationsRoot, record.id));
  await applyResourceChanges(record.id, resourceChanges);
  await writePublication(record);
  await syncPublications(projectRoot);
  console.log(`\n已添加：${record.title}\n`);
}

async function editPublication(terminal, requestedId) {
  const catalog = await readCatalog();
  const existing = await choosePublication(terminal, catalog, requestedId);
  const { record, resourceChanges } = await collectPublication(terminal, catalog, existing);
  const backup = await createBackup(existing.id);
  await applyResourceChanges(existing.id, resourceChanges);
  await writePublication(record);
  await syncPublications(projectRoot);
  console.log(`\n已更新：${record.title}`);
  console.log(`备份：${path.relative(projectRoot, backup)}\n`);
}

async function removePublication(terminal, requestedId) {
  const catalog = await readCatalog();
  const publication = await choosePublication(terminal, catalog, requestedId);
  const confirmation = await terminal.question(`输入 ${publication.id} 确认删除（其他输入将取消）: `);
  if (confirmation.trim() !== publication.id) {
    console.log('\n已取消。\n');
    return;
  }
  const backup = await createBackup(publication.id);
  await rm(path.join(publicationsRoot, publication.id), { recursive: true });
  await syncPublications(projectRoot);
  console.log(`\n已删除：${publication.title}`);
  console.log(`可从 ${path.relative(projectRoot, backup)} 恢复。\n`);
}

function printHelp() {
  console.log(`\n论文管理器\n\n用法：\n  npm run publication:manage\n  npm run publication:manage -- list\n  npm run publication:manage -- add\n  npm run publication:manage -- edit [id]\n  npm run publication:manage -- remove [id]\n\n不带参数会进入交互菜单。\n`);
}

async function interactiveMenu(terminal) {
  while (true) {
    console.log('论文管理器\n  1. 查看论文\n  2. 新增论文\n  3. 编辑论文\n  4. 删除论文\n  0. 退出');
    const action = (await terminal.question('选择操作: ')).trim();
    if (action === '0') return;
    try {
      if (action === '1') printPublications(await readCatalog());
      else if (action === '2') await addPublication(terminal);
      else if (action === '3') await editPublication(terminal);
      else if (action === '4') await removePublication(terminal);
      else console.log('\n请输入 0–4。\n');
    } catch (error) {
      console.error(`\n操作失败：${error.message}\n`);
    }
  }
}

async function main() {
  const [command, requestedId] = process.argv.slice(2);
  if (command === '--help' || command === '-h' || command === 'help') {
    printHelp();
    return;
  }
  if (command === 'list') {
    printPublications(await readCatalog());
    return;
  }
  if (!command && !input.isTTY) {
    printHelp();
    return;
  }

  const terminal = createInterface({ input, output });
  try {
    if (!command) await interactiveMenu(terminal);
    else if (command === 'add') await addPublication(terminal);
    else if (command === 'edit') await editPublication(terminal, requestedId);
    else if (command === 'remove') await removePublication(terminal, requestedId);
    else throw new Error(`未知命令：${command}`);
  } finally {
    terminal.close();
  }
}

main().catch((error) => {
  console.error(`论文管理器出错：${error.message}`);
  process.exitCode = 1;
});
