import { api } from "@/app/api/apiSlice";
import { getReactionChanges } from "./utils";
import { RootState } from "@/app/store";
import { EntityState, createEntityAdapter } from "@reduxjs/toolkit";
import { commentApi, commentsAdapter, commentsSelector } from "./commentsApiSlice";

interface PostUser {
  id: string;
  username: string;
  name: string;
}

interface PostsResponse {
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
}

export interface CreatePostRequest {
  text: string;
  originalId?: string;
  commentToId?: string;
  responseToId?: string;
}

interface ReactionRequest {
  postId: string;
  liked: boolean;
  commentToId?: string;
  responseToId?: string;
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
        dispatch(
          postApi.util.updateQueryData("getPosts", 0, (draft) => {
            postsAdapter.addOne(draft.posts, {
              id: data.id,
              text,
              user,
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
            });
          })
        );
      },
    }),
    processReaction: builder.mutation<undefined, ReactionRequest>({
      query: (body) => ({ url: "post/reaction", method: "POST", body }),
      async onQueryStarted(
        { postId, liked, commentToId, responseToId },
        { dispatch, queryFulfilled }
      ) {
        const patches = [
          dispatch(
            postApi.util.updateQueryData("getPosts", 0, (draft) => {
              const post = postsSelector.selectById(draft.posts, postId);
              const changes = getReactionChanges(post, liked);
              postsAdapter.updateOne(draft.posts, { id: postId, changes });
            })
          ),
          dispatch(
            postApi.util.updateQueryData("getPostById", postId, (draft) =>
              Object.assign(draft, getReactionChanges(draft, liked))
            )
          ),
          commentToId &&
            dispatch(
              commentApi.util.updateQueryData(
                "getComments",
                { page: 0, postId: commentToId },
                (draft) => {
                  const comment = commentsSelector.selectById(draft.comments, postId);
                  const changes = getReactionChanges(comment, liked);
                  commentsAdapter.updateOne(draft.comments, { id: postId, changes });
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
                      r.id === postId ? { ...r, ...getReactionChanges(r, liked) } : r
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
  }),
});

export const {
  useCreatePostMutation,
  useGetPostsQuery,
  useProcessReactionMutation,
  useGetPostByIdQuery,
} = postApi;
