import { AnyAction, ThunkDispatch } from "@reduxjs/toolkit";
import {
  Post,
  PostsResponse,
  postApi,
  postsAdapter,
  postsSelector,
} from "./postsApiSlice";
import { userApi, userPostsAdapter, userPostsSelector } from "../user/userApiSlice";

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
  let postData = null as Post | null;

  function updateRecipe(draft: PostsResponse) {
    const post = postsSelector.selectById(draft.posts, postId);
    if (!post) return;
    postData = post;

    if (typeof changes === "function") changes = changes(post);
    postsAdapter.updateOne(draft.posts, { id: postId, changes });
  }

  const result = [
    dispatch(postApi.util.updateQueryData("getPosts", 0, updateRecipe)),
    dispatch(
      postApi.util.updateQueryData("getPostById", postId, (draft) =>
        Object.assign(draft, changes)
      )
    ),
    dispatch(postApi.util.updateQueryData("getFavoritePosts", 0, updateRecipe)),
  ];

  if (postData && !postData.user.isDeleted)
    result.push(
      dispatch(
        userApi.util.updateQueryData(
          "getUserPosts",
          { page: 0, id: postData.user.id },
          (draft) => {
            const p = userPostsSelector.selectById(draft.posts, postId);
            if (!p) return;

            if (typeof changes === "function") changes = changes(p);
            userPostsAdapter.updateOne(draft.posts, { id: p.id, changes });
          }
        )
      )
    );

  return result;
}
