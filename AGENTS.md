# AGENTS

## Digestibles

To convert a `##` section in a blog post into a digestible, run:

```bash
pnpm digestible -- <version> <section title>
```

Example:

```bash
pnpm digestible -- 1.2.0 Growth
```

Useful flags:

- `--dry-run` shows which files would be written or updated.
- `--description "..."` adds a digestible description to frontmatter.
- `--force` overwrites an existing digestible file.

What it does:

- extracts the matching `## <section title>` section from `src/content/blog/v<version>.mdx`
- writes the digestible to `src/content/digestibles/v<version>/<slug>.mdx`
- ensures the source blog post imports `DigestibleLink`
- ensures the source section contains `<DigestibleLink version="..." title="..." />`
