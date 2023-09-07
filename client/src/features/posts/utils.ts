import { AnyAction, ThunkDispatch } from "@reduxjs/toolkit";
import { Post, postApi, postsAdapter, postsSelector } from "./postsApiSlice";

export function getReactionChanges(post: Post | undefined, liked: boolean) {
  const r = liked ? 1 : -1;
  const changes = {
    reaction: post?.reaction || (0 as Post["reaction"]),
    likes: post?.likes || 0,
    dislikes: post?.dislikes || 0,
  };

  if (post?.reaction === r) {
    changes.reaction = 0;
    if (liked) changes.likes--;
    else changes.dislikes--;
  } else if (changes?.reaction === 0) {
    changes.reaction = r;
    if (liked) changes.likes++;
    else changes.dislikes++;
  } else if (post) {
    changes.reaction = r;
    if (liked) {
      changes.likes++;
      changes.dislikes--;
    } else {
      changes.likes--;
      changes.dislikes++;
    }
  }
  return changes;
}

export type PostType = "post" | "comment" | "response";

export function updatePost(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: ThunkDispatch<any, any, AnyAction>,
  postId: string,
  changes: Partial<Post> | ((post: Post) => Partial<Post>)
) {
  return [
    dispatch(
      postApi.util.updateQueryData("getPosts", 0, (draft) => {
        const post = postsSelector.selectById(draft.posts, postId);
        if (!post) return;

        if (typeof changes === "function") changes = changes(post);
        postsAdapter.updateOne(draft.posts, { id: postId, changes });
      })
    ),
    dispatch(
      postApi.util.updateQueryData("getPostById", postId, (draft) =>
        Object.assign(draft, changes)
      )
    ),
  ];
}
