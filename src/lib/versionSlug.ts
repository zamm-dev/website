import type { BlogPost } from "../content/config";

export default function (post: BlogPost) {
  return `v${post.zammVersion}`;
}
