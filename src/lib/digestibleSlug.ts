export default function digestibleSlug(version: string, title: string) {
  const slugTitle = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  return `v${version}/${slugTitle}`;
}
