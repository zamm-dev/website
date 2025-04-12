import { defineCollection, reference, z } from 'astro:content';

export const ReleaseLinksSchema = z.object({
	page: z.string(),
	installers: z.object({
		linuxAppImage: z.string(),
		linuxDeb: z.string(),
		macDmg: z.string(),
		windowsExe: z.string(),
		windowsMsi: z.string(),
	}).optional(),
});

export type ReleaseLinks = z.infer<typeof ReleaseLinksSchema>;

export const DiscussionLinksSchema = z.object({
	hackerNews: z.string().optional(),
	lemmy: z.string().optional(),
});

export type DiscussionLinks = z.infer<typeof DiscussionLinksSchema>;

const BlogSchema = z.object({
	zammVersion: z.string(),
	title: z.string(),
	description: z.string().optional(),
	releaseLinks: ReleaseLinksSchema.optional(),
	discussions: DiscussionLinksSchema.optional(),
	// Transform string to Date object
	pubDate: z.coerce.date(),
	updatedDate: z.coerce.date().optional(),
	heroImage: z.string().optional(),
});

export type BlogPost = z.infer<typeof BlogSchema>;

const blog = defineCollection({
	type: 'content',
	schema: BlogSchema,
});

const DigestibleSchema = z.object({
	blogPost: reference('blog'),
	title: z.string(),
	description: z.string().optional(),
	pubDate: z.coerce.date(),
	updatedDate: z.coerce.date().optional(),
});

export type Digestible = z.infer<typeof DigestibleSchema>;

const digestibles = defineCollection({
	type: 'content',
	schema: DigestibleSchema,
});

export const collections = { blog, digestibles };
