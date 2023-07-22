import { PostResponse } from "./postsApiSlice";

export function setReaction(post: PostResponse | undefined, liked: boolean) {
  const r = liked ? 1 : -1;
  if (post?.reaction === r) {
    post.reaction = 0;
    if (liked) post.likes--;
    else post.dislikes--;
  } else if (post?.reaction === 0) {
    post.reaction = r;
    if (liked) post.likes++;
    else post.dislikes++;
  } else if (post) {
    post.reaction = r;
    if (liked) {
      post.likes++;
      post.dislikes--;
    } else {
      post.likes--;
      post.dislikes++;
    }
  }
}
