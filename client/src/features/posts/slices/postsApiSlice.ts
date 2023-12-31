import { api } from "@/app/api/apiSlice";
import { WithOrigin, getReactionChanges, updatePost } from "./utils";
import { RootState } from "@/app/store";
import { EntityState, createEntityAdapter } from "@reduxjs/toolkit";
import {
  IComment,
  commentApi,
  commentsAdapter,
  commentsSelector,
} from "./commentsApiSlice";
import { userApi } from "../../user/userApiSlice";
import { User } from "../../auth/authSlice";

export type PostUser =
  | (Partial<User> & { isDeleted: true })
  | (User & {
      isDeleted: false;
    });

export interface PostMedia {
  id: string;
  url: string;
  urlModifiers: string;
  type: string;
  mime: string;
  subtype: string;
  width: number;
  height: number;
}

interface PostInfo {
  updatedAt: string | null;
  originalId: string | null;
  commentToId: string | null;
  responseToId: string | null;
  likes: number;
  dislikes: number;
  comments: number;
  responseCount: number;
  reposts: number;
  reaction: -1 | 0 | 1;
  isFavorite: boolean;
  canComment: boolean;
}

export interface NormalPost extends PostInfo {
  id: string;
  text: string;
  user: PostUser;
  createdAt: string;
  isDeleted: false;
  media: PostMedia[];
}

export interface DeletedPost extends PostInfo {
  id: string;
  createdAt: string;
  isDeleted: true;
}

export type Post = PostInfo & (NormalPost | DeletedPost);

export interface PostsResponse {
  posts: EntityState<Post>;
  hasMore: boolean;
}

export interface CreatePostRequest {
  text: string;
  originalId?: string;
  commentToId?: string;
  responseToId?: string;
  canComment: boolean;
  media: PostMedia[];
}

interface ReactionRequest {
  post: WithOrigin<Post>;
  liked: boolean;
}

type ChangePostRequest = Partial<Pick<NormalPost, "text" | "canComment" | "media">>;

interface PostHistoryResponse {
  changes: Pick<NormalPost, "text" | "createdAt" | "isDeleted">[];
  media: (PostMedia & { createdAt: string; updatedAt: string; isDeleted: boolean })[];
}

type PostHistory = {
  date: string;
  text?: string;
  isDeleted?: boolean;
  addMedia: PostMedia[];
  deletedMedia: PostMedia[];
};

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
          posts: postsAdapter.setMany(postsAdapter.getInitialState(), posts),
          hasMore,
        };
      },
      serializeQueryArgs: ({ endpointName }) => {
        return endpointName;
      },
      merge: (currentCache, newItems) => {
        postsAdapter.setMany(currentCache.posts, postsSelector.selectAll(newItems.posts));
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
      invalidatesTags: [{ type: "Tags" }],
      async onQueryStarted(
        { text, originalId, responseToId, commentToId, canComment, media },
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
          responseCount: 0,
          likes: 0,
          dislikes: 0,
          reposts: 0,
          reaction: 0,
          isFavorite: false,
          canComment,
          isDeleted: false,
          media,
        };
        if (originalId) {
          updatePost(dispatch, { id: originalId }, (post) => ({
            reposts: post.reposts + 1,
          }));
        }
        if (commentToId && !responseToId) {
          dispatch(
            commentApi.util.updateQueryData(
              "getComments",
              { page: 0, postId: commentToId },
              (draft) => {
                commentsAdapter.addOne(draft.comments, {
                  ...newPost,
                  responses: [],
                  isNew: true,
                } as IComment);
                draft.total++;
              }
            )
          );
        } else if (responseToId && commentToId) {
          dispatch(
            commentApi.util.updateQueryData(
              "getComments",
              { page: 0, postId: commentToId },
              (draft) => {
                const comment = commentsSelector.selectById(draft.comments, responseToId);
                if (!comment) return;

                const changed = comment.responses.slice();
                changed.splice(
                  originalId
                    ? comment.responses.findIndex((p) => p.id === originalId) + 1
                    : 0,
                  0,
                  newPost as Post
                );

                const changes = { responses: changed };
                commentsAdapter.updateOne(draft.comments, {
                  id: responseToId,
                  changes,
                });
                draft.total++;
              }
            )
          );
        } else if (!responseToId && !commentToId) {
          dispatch(
            userApi.util.updateQueryData(
              "getUserPosts",
              { id: user.id, page: 0 },
              (draft) => {
                postsAdapter.addOne(draft.posts, newPost as Post);
              }
            )
          );
          dispatch(
            postApi.util.updateQueryData("getPosts", 0, (draft) => {
              postsAdapter.addOne(draft.posts, newPost as Post);
            })
          );
        }
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
        const patches = updatePost(dispatch, post, getReactionChanges(post, liked));
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
          posts: postsAdapter.setMany(postsAdapter.getInitialState(), posts),
          hasMore,
        };
      },
      serializeQueryArgs: ({ endpointName }) => {
        return endpointName;
      },
      merge: (currentCache, newItems) => {
        postsAdapter.setMany(currentCache.posts, postsSelector.selectAll(newItems.posts));
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

    handleFavorite: builder.mutation<undefined, WithOrigin<Post>>({
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
          ...updatePost(dispatch, post, (post) => ({
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

    changePost: builder.mutation<
      undefined,
      { post: WithOrigin<NormalPost>; changes: ChangePostRequest }
    >({
      query: ({ post, changes }) => ({
        url: `post/${post.id}`,
        method: "PATCH",
        body: changes,
      }),
      invalidatesTags: (_result, _error, { post }) => [{ type: "History", id: post.id }],
      onQueryStarted: async ({ post, changes }, { dispatch, queryFulfilled }) => {
        await queryFulfilled;
        updatePost(dispatch, post, { ...changes, updatedAt: new Date().toString() });
      },
    }),

    deletePost: builder.mutation<undefined, NormalPost>({
      query: (post) => ({
        url: `post/${post.id}`,
        method: "DELETE",
      }),
      async onQueryStarted(post, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        updatePost(dispatch, post, { isDeleted: true });
      },
    }),

    getPostHistory: builder.query<PostHistory[], string>({
      query: (id) => ({ url: `post/${id}/history` }),
      providesTags: (_result, _error, id) => [{ type: "History", id }],
      transformResponse: ({ changes, media }: PostHistoryResponse) => {
        const result = new Map<string, PostHistory>();

        for (const { createdAt, text, isDeleted } of changes) {
          result.set(createdAt, {
            date: createdAt,
            text,
            isDeleted,
            addMedia: [],
            deletedMedia: [],
          });
        }

        for (const m of media) {
          if (m.isDeleted) {
            const h = result.get(m.updatedAt);
            if (h) h.deletedMedia.push(m);
            else
              result.set(m.updatedAt, {
                date: m.updatedAt,
                addMedia: [],
                deletedMedia: [m],
              });
          }
          const h = result.get(m.createdAt);
          if (h) h.addMedia.push(m);
          else
            result.set(m.createdAt, {
              date: m.createdAt,
              addMedia: [m],
              deletedMedia: [],
            });
        }

        return Array.from(result, ([, v]) => v).sort(
          (a, b) => +new Date(a.date) - +new Date(b.date)
        );
      },
    }),

    searchPost: builder.query<PostsResponse, { query: string; page: number }>({
      query: ({ query, page }) => ({ url: "post/search", params: { q: query, page } }),
      keepUnusedDataFor: 0,
      transformResponse: ({ posts, hasMore }: { posts: Post[]; hasMore: boolean }) => {
        return {
          posts: postsAdapter.setMany(postsAdapter.getInitialState(), posts),
          hasMore,
        };
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        return endpointName + queryArgs.query;
      },
      merge: (currentCache, newItems) => {
        postsAdapter.setMany(currentCache.posts, postsSelector.selectAll(newItems.posts));
        currentCache.hasMore = newItems.hasMore;
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.page !== previousArg?.query;
      },
      providesTags: (result, _, { query }) =>
        result
          ? [
              ...result.posts.ids.map((id) => ({ type: "Posts" as const, id, query })),
              { type: "Posts", id: "SEARCH", query },
            ]
          : [{ type: "Posts", id: "SEARCH", query }],
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
  useChangePostMutation,
  useDeletePostMutation,
  useGetPostHistoryQuery,
  useSearchPostQuery,
} = postApi;
