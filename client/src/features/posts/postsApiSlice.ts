import { api } from "@/app/api/apiSlice";
import { getReactionChanges, updatePost } from "./utils";
import { RootState } from "@/app/store";
import { EntityState, createEntityAdapter } from "@reduxjs/toolkit";
import {
  IComment,
  commentApi,
  commentsAdapter,
  commentsSelector,
} from "./commentsApiSlice";

type PostUser =
  | {
      id: string;
      username: string;
      name: string;
      avatarUrl: string | null;
      isDeleted: false;
    }
  | {
      isDeleted: true;
    };

export interface PostsResponse {
  posts: EntityState<Post>;
  hasMore: boolean;
}

export interface Post {
  id: string;
  text: string;
  user: PostUser;
  createdAt: string;
  updatedAt: string | null;
  originalId: string | null;
  commentToId: string | null;
  responseToId: string | null;
  likes: number;
  dislikes: number;
  comments: number;
  reposts: number;
  reaction: -1 | 0 | 1;
  isFavorite: boolean;
}

export interface CreatePostRequest {
  text: string;
  originalId?: string;
  commentToId?: string;
  responseToId?: string;
}

interface ReactionRequest {
  post: Post;
  liked: boolean;
}

export const postsAdapter = createEntityAdapter<Post>({
  sortComparer: (a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)),
});
export const postsSelector = postsAdapter.getSelectors();

export const postApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPostById: builder.query<Post, string>({
      query: (id) => ({ url: `post/${id}` }),
      providesTags: (_result, _error, id) => [{ type: "Posts", id }],
    }),
    getPosts: builder.query<PostsResponse, number>({
      query: (page) => ({ url: `post?page=${page}` }),
      transformResponse: ({ posts, hasMore }: { posts: Post[]; hasMore: boolean }) => {
        return {
          posts: postsAdapter.addMany(postsAdapter.getInitialState(), posts),
          hasMore,
        };
      },
      serializeQueryArgs: ({ endpointName }) => {
        return endpointName;
      },
      merge: (currentCache, newItems) => {
        postsAdapter.addMany(currentCache.posts, postsSelector.selectAll(newItems.posts));
        currentCache.hasMore = newItems.hasMore;
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.posts.ids.map((id) => ({ type: "Posts" as const, id })),
              { type: "Posts", id: "LIST" },
            ]
          : [{ type: "Posts", id: "LIST" }],
    }),
    createPost: builder.mutation<{ id: string }, CreatePostRequest>({
      query: (body) => ({ url: "post", method: "POST", body }),
      async onQueryStarted(
        { text, originalId, responseToId, commentToId },
        { dispatch, queryFulfilled, getState }
      ) {
        const user = (getState() as RootState).auth.user;
        if (!user) return;

        const { data } = await queryFulfilled;
        const newPost = {
          id: data.id,
          text,
          user: { ...user, isDeleted: false },
          createdAt: new Date().toISOString(),
          updatedAt: null,
          originalId: originalId || null,
          responseToId: responseToId || null,
          commentToId: commentToId || null,
          comments: 0,
          likes: 0,
          dislikes: 0,
          reposts: 0,
          reaction: 0,
          isFavorite: false,
        };
        dispatch(
          postApi.util.updateQueryData("getPosts", 0, (draft) => {
            postsAdapter.addOne(draft.posts, newPost as Post);
          })
        );
        if (originalId) {
          updatePost(dispatch, originalId, (post) => ({ reposts: post.reposts + 1 }));
        }
        if (commentToId && !responseToId) {
          (newPost as unknown as IComment).responses = [];
          (newPost as unknown as IComment).isNew = true;
          dispatch(
            commentApi.util.updateQueryData(
              "getComments",
              { page: 0, postId: commentToId },
              (draft) => {
                commentsAdapter.addOne(draft.comments, newPost as unknown as IComment);
                draft.total++;
              }
            )
          );
        }
        if (responseToId && commentToId)
          dispatch(
            commentApi.util.updateQueryData(
              "getComments",
              { page: 0, postId: commentToId },
              (draft) => {
                const comment = commentsSelector.selectById(draft.comments, responseToId);
                if (!comment) return;
                const changes = {
                  responses: [newPost as Post, ...comment.responses],
                };
                commentsAdapter.updateOne(draft.comments, {
                  id: responseToId,
                  changes,
                });
              }
            )
          );
      },
    }),
    processReaction: builder.mutation<undefined, ReactionRequest>({
      query: ({ post, liked }) => ({
        url: "post/reaction",
        method: "POST",
        body: {
          postId: post.id,
          liked,
          commentToId: post.commentToId,
          responseToId: post.responseToId,
        },
      }),
      async onQueryStarted({ post, liked }, { dispatch, queryFulfilled }) {
        const { commentToId, responseToId, id } = post;
        const patches = [
          ...updatePost(dispatch, id, getReactionChanges(post, liked)),
          commentToId &&
            dispatch(
              commentApi.util.updateQueryData(
                "getComments",
                { page: 0, postId: commentToId },
                (draft) => {
                  const comment = commentsSelector.selectById(draft.comments, id);
                  const changes = getReactionChanges(comment, liked);
                  commentsAdapter.updateOne(draft.comments, { id, changes });
                }
              )
            ),
          responseToId &&
            commentToId &&
            dispatch(
              commentApi.util.updateQueryData(
                "getComments",
                { page: 0, postId: commentToId },
                (draft) => {
                  const comment = commentsSelector.selectById(
                    draft.comments,
                    responseToId
                  );
                  if (!comment) return;
                  const changes = {
                    responses: comment.responses.map((r) =>
                      r.id === id ? { ...r, ...getReactionChanges(r, liked) } : r
                    ),
                  };
                  commentsAdapter.updateOne(draft.comments, {
                    id: responseToId,
                    changes,
                  });
                }
              )
            ),
        ];
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p && p.undo());
        }
      },
    }),

    getFavoritePosts: builder.query<PostsResponse, number>({
      query: (page) => ({ url: `post/favorite?page=${page}` }),
      keepUnusedDataFor: 0,
      transformResponse: ({ posts, hasMore }: { posts: Post[]; hasMore: boolean }) => {
        return {
          posts: postsAdapter.addMany(postsAdapter.getInitialState(), posts),
          hasMore,
        };
      },
      serializeQueryArgs: ({ endpointName }) => {
        return endpointName;
      },
      merge: (currentCache, newItems) => {
        postsAdapter.addMany(currentCache.posts, postsSelector.selectAll(newItems.posts));
        currentCache.hasMore = newItems.hasMore;
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.posts.ids.map((id) => ({ type: "Posts" as const, id })),
              { type: "Favorite", id: "LIST" },
            ]
          : [{ type: "Favorite", id: "LIST" }],
    }),

    handleFavorite: builder.mutation<undefined, Post>({
      query: ({ id }) => ({ url: "post/favorite", method: "POST", body: { postId: id } }),
      async onQueryStarted(post, { dispatch, queryFulfilled, getState }) {
        const user = (getState() as RootState).auth.user;
        if (!user) return;

        const patches = [
          dispatch(
            postApi.util.updateQueryData("getFavoritePosts", 0, (draft) => {
              if (!post.isFavorite) postsAdapter.addOne(draft.posts, post);
            })
          ),
          ...updatePost(dispatch, post.id, (post) => ({
            isFavorite: !post.isFavorite,
          })),
        ];
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p && p.undo());
        }
      },
    }),
  }),
});

export const {
  useCreatePostMutation,
  useGetPostsQuery,
  useProcessReactionMutation,
  useGetPostByIdQuery,
  useGetFavoritePostsQuery,
  useHandleFavoriteMutation,
} = postApi;
