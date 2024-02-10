import type { CollectionEntry } from 'astro:content';

type BlogEntry = CollectionEntry<'blog'>;

export default function (entry: BlogEntry) {
  return `v${entry.data.zammVersion}`;
}
