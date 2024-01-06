import { AnyAction, ThunkDispatch } from "@reduxjs/toolkit";
import {
  NormalPost,
  Post,
  PostsResponse,
  postApi,
  postsAdapter,
  postsSelector,
} from "./postsApiSlice";
import { userApi } from "../user/userApiSlice";
import { commentApi, commentsAdapter, commentsSelector } from "./commentsApiSlice";
import { tagsApi } from "../tags/tagsApiSlice";

export interface PostOrigin {
  tag?: string;
  search?: string;
}

export type WithOrigin<T> = T & { from?: PostOrigin };

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

type TPostData = Pick<Post, "id"> &
  Partial<Pick<NormalPost, "commentToId" | "responseToId" | "user">> & {
    from?: PostOrigin;
  };

export function updatePost(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: ThunkDispatch<any, any, AnyAction>,
  post: TPostData,
  postChanges: Partial<Post> | ((post: Post) => Partial<Post>)
) {
  let user = post.user;

  function updateRecipe(draft: PostsResponse) {
    const p = postsSelector.selectById(draft.posts, post.id);
    if (!p) return;

    if (!user && !p.isDeleted) user = p.user;

    const changes = typeof postChanges === "function" ? postChanges(p) : postChanges;
    postsAdapter.updateOne(draft.posts, { id: post.id, changes });
  }

  const result = [
    dispatch(postApi.util.updateQueryData("getPosts", 0, updateRecipe)),
    dispatch(
      postApi.util.updateQueryData("getPostById", post.id, (draft) => {
        const changes =
          typeof postChanges === "function" ? postChanges(draft) : postChanges;
        Object.assign(draft, changes);
      })
    ),
    dispatch(postApi.util.updateQueryData("getFavoritePosts", 0, updateRecipe)),
  ];

  if (user && !user.isDeleted)
    result.push(
      dispatch(
        userApi.util.updateQueryData(
          "getUserPosts",
          { page: 0, id: user.id },
          updateRecipe
        )
      )
    );

  if (post.commentToId)
    result.push(
      dispatch(
        commentApi.util.updateQueryData(
          "getComments",
          { page: 0, postId: post.commentToId },
          (draft) => {
            if (post.responseToId) {
              const comment = commentsSelector.selectById(
                draft.comments,
                post.responseToId
              );
              if (!comment) return;
              const commentChanges = {
                responses: comment.responses.map((r) => {
                  if (r.id === post.id)
                    return {
                      ...r,
                      ...(typeof postChanges === "function"
                        ? postChanges(r)
                        : postChanges),
                    };
                  return r;
                }) as Post[],
              };
              commentsAdapter.updateOne(draft.comments, {
                id: post.responseToId,
                changes: commentChanges,
              });

              return;
            }

            const comment = commentsSelector.selectById(draft.comments, post.id);
            if (!comment) return;

            const changes =
              typeof postChanges === "function" ? postChanges(comment) : postChanges;
            commentsAdapter.updateOne(draft.comments, {
              id: post.id,
              changes,
            });
          }
        )
      )
    );

  if (post.from?.tag)
    result.push(
      dispatch(
        tagsApi.util.updateQueryData(
          "getTagPosts",
          { tag: post.from.tag, page: 0 },
          updateRecipe
        )
      )
    );

  if (post.from?.search)
    result.push(
      dispatch(
        postApi.util.updateQueryData(
          "searchPost",
          { query: post.from.search, page: 0 },
          updateRecipe
        )
      )
    );

  return result;
}
