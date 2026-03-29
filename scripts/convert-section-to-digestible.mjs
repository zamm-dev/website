import fs from 'node:fs/promises';
import path from 'node:path';

const cwd = process.cwd();
const blogRoot = path.join(cwd, 'src', 'content', 'blog');
const digestiblesRoot = path.join(cwd, 'src', 'content', 'digestibles');
const digestibleImport = "import DigestibleLink from '../../components/DigestibleLink.astro';";

function usage() {
  console.error(
    'Usage: node scripts/convert-section-to-digestible.mjs <version> <section title> [--description "text"] [--force] [--dry-run]'
  );
}

function parseArgs(argv) {
  const positional = [];
  let description;
  let force = false;
  let dryRun = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--description') {
      description = argv[i + 1];
      i += 1;
      continue;
    }

    if (arg === '--force') {
      force = true;
      continue;
    }

    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }

    positional.push(arg);
  }

  if (positional.length < 2) {
    usage();
    process.exit(1);
  }

  if (argv.includes('--description') && description == null) {
    console.error('--description requires a value');
    process.exit(1);
  }

  return {
    version: positional[0],
    title: positional.slice(1).join(' '),
    description,
    force,
    dryRun,
  };
}

function slugifyTitle(title) {
  return title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

function compactVersion(version) {
  return `v${version.replace(/\./g, '')}`;
}

function splitFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);

  if (!match) {
    throw new Error('Blog post is missing frontmatter');
  }

  return {
    frontmatterBlock: match[0],
    frontmatter: match[1],
    body: content.slice(match[0].length),
  };
}

function getFrontmatterValue(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*['"]?(.+?)['"]?$`, 'm'));
  return match?.[1];
}

function escapeSingleQuotes(value) {
  return value.replace(/'/g, "\\'");
}

function findSection(body, title) {
  const lines = body.split('\n');
  const headingLine = `## ${title}`;
  const startIndex = lines.findIndex((line) => line.trim() === headingLine);

  if (startIndex === -1) {
    throw new Error(`Section not found: ${title}`);
  }

  let endIndex = lines.length;
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    if (/^##\s+/.test(lines[i])) {
      endIndex = i;
      break;
    }
  }

  return {
    lines,
    startIndex,
    endIndex,
  };
}

function stripLeadingDigestibleLink(lines, version, title) {
  const linkLine = `<DigestibleLink version="${version}" title="${title}" />`;
  let start = 0;

  while (start < lines.length && lines[start].trim() === '') {
    start += 1;
  }

  if (lines[start]?.trim() === linkLine) {
    start += 1;
    while (start < lines.length && lines[start].trim() === '') {
      start += 1;
    }
  }

  return lines.slice(start).join('\n').trim();
}

function buildDigestibleFrontmatter({ title, compactBlogVersion, pubDate, updatedDate, description }) {
  const frontmatterLines = [
    '---',
    `title: '${escapeSingleQuotes(title)}'`,
    `blogPost: '${compactBlogVersion}'`,
  ];

  if (description) {
    frontmatterLines.push(`description: '${escapeSingleQuotes(description)}'`);
  }

  frontmatterLines.push(`pubDate: '${escapeSingleQuotes(pubDate)}'`);

  if (updatedDate) {
    frontmatterLines.push(`updatedDate: '${escapeSingleQuotes(updatedDate)}'`);
  }

  frontmatterLines.push('---', '');
  return frontmatterLines.join('\n');
}

function ensureDigestibleImport(source) {
  if (source.includes(digestibleImport)) {
    return source;
  }

  const { frontmatterBlock, body } = splitFrontmatter(source);
  const trimmedBody = body.replace(/^\n*/, '');
  return `${frontmatterBlock}\n${digestibleImport}\n\n${trimmedBody}`;
}

function ensureDigestibleLinkInSection(body, sectionStartIndex, version, title) {
  const lines = body.split('\n');
  const linkLine = `<DigestibleLink version="${version}" title="${title}" />`;

  let probeIndex = sectionStartIndex + 1;
  while (probeIndex < lines.length && lines[probeIndex].trim() === '') {
    probeIndex += 1;
  }

  if (lines[probeIndex]?.trim() === linkLine) {
    return body;
  }

  lines.splice(sectionStartIndex + 1, 0, '', linkLine, '');
  return lines.join('\n');
}

async function main() {
  const { version, title, description, force, dryRun } = parseArgs(process.argv.slice(2));
  const blogPath = path.join(blogRoot, `v${version}.mdx`);
  const digestibleDir = path.join(digestiblesRoot, `v${version}`);
  const digestiblePath = path.join(digestibleDir, `${slugifyTitle(title)}.mdx`);

  const blogSource = await fs.readFile(blogPath, 'utf8');
  const { frontmatter, body } = splitFrontmatter(blogSource);
  const pubDate = getFrontmatterValue(frontmatter, 'pubDate');
  const updatedDate = getFrontmatterValue(frontmatter, 'updatedDate');

  if (!pubDate) {
    throw new Error(`pubDate not found in ${path.relative(cwd, blogPath)}`);
  }

  const section = findSection(body, title);
  const sectionBody = stripLeadingDigestibleLink(
    section.lines.slice(section.startIndex + 1, section.endIndex),
    version,
    title
  );

  if (!sectionBody) {
    throw new Error(`Section "${title}" does not contain any body content`);
  }

  const digestibleSource = [
    buildDigestibleFrontmatter({
      title,
      compactBlogVersion: compactVersion(version),
      pubDate,
      updatedDate,
      description,
    }),
    sectionBody,
    '',
  ].join('\n');

  let digestibleExists = false;
  try {
    await fs.access(digestiblePath);
    digestibleExists = true;
  } catch {
    digestibleExists = false;
  }

  if (digestibleExists && !force && !dryRun) {
    throw new Error(
      `Digestible already exists at ${path.relative(cwd, digestiblePath)}. Re-run with --force to overwrite it.`
    );
  }

  const blogWithImport = ensureDigestibleImport(blogSource);
  const { body: updatedBody } = splitFrontmatter(blogWithImport);
  const updatedSection = findSection(updatedBody, title);
  const nextBlogSource = ensureDigestibleLinkInSection(updatedBody, updatedSection.startIndex, version, title);
  const finalBlogSource = blogWithImport.replace(updatedBody, nextBlogSource);

  if (dryRun) {
    console.log(
      digestibleExists
        ? `Would overwrite ${path.relative(cwd, digestiblePath)}`
        : `Would write ${path.relative(cwd, digestiblePath)}`
    );
    console.log(`Would update ${path.relative(cwd, blogPath)}`);
    return;
  }

  await fs.mkdir(digestibleDir, { recursive: true });
  await fs.writeFile(digestiblePath, digestibleSource);
  await fs.writeFile(blogPath, finalBlogSource);

  console.log(`Wrote ${path.relative(cwd, digestiblePath)}`);
  console.log(`Updated ${path.relative(cwd, blogPath)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
