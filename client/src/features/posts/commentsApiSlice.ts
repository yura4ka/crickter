import { EntityState, createEntityAdapter } from "@reduxjs/toolkit";
import { CreatePostRequest, Post, postApi, postsAdapter } from "./postsApiSlice";
import { api } from "@/app/api/apiSlice";
import { RootState } from "@/app/store";

export interface IComment extends Post {
  responses: Post[];
}

interface CommentsResponse {
  comments: EntityState<IComment>;
  total: number;
  hasMore: boolean;
}

interface DataResponse {
  comments: Omit<IComment, "responses">[];
  total: number;
  hasMore: boolean;
}

export const commentsAdapter = createEntityAdapter<IComment>({
  sortComparer: (a, b) => b.dislikes + b.likes - a.dislikes - a.likes,
});
export const commentsSelector = commentsAdapter.getSelectors();

export const commentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getComments: builder.query<CommentsResponse, { page: number; postId: string }>({
      query: ({ page, postId }) => ({ url: `comment?postId=${postId}&page=${page}` }),
      transformResponse: ({ comments, total, hasMore }: DataResponse) => {
        return {
          comments: commentsAdapter.addMany(
            commentsAdapter.getInitialState(),
            comments.map((c) => ({ ...c, responses: [] }))
          ),
          total,
          hasMore,
        };
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        return endpointName + queryArgs.postId;
      },
      merge: (currentCache, newItems) => {
        commentsAdapter.addMany(
          currentCache.comments,
          commentsSelector.selectAll(newItems.comments)
        );
        currentCache.total = newItems.total;
      },
      forceRefetch({ currentArg, previousArg }) {
        return (
          currentArg?.page !== previousArg?.page ||
          currentArg?.postId !== previousArg?.postId
        );
      },
      providesTags: (result) =>
        result
          ? [
              ...result.comments.ids.map((id) => ({ type: "Comments" as const, id })),
              { type: "Comments", id: "LIST" },
            ]
          : [{ type: "Comments", id: "LIST" }],

      async onQueryStarted({ postId }, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(
          postApi.util.updateQueryData("getPosts", 0, (draft) => {
            postsAdapter.updateOne(draft.posts, {
              id: postId,
              changes: { comments: data.total },
            });
          })
        );
        dispatch(
          postApi.util.updateQueryData("getPostById", postId, (draft) =>
            Object.assign(draft, { comments: data.total })
          )
        );
      },
    }),

    createComment: builder.mutation<
      { id: string },
      CreatePostRequest & { postId: string }
    >({
      query: ({ postId, ...body }) => ({
        url: `comment/${postId}`,
        method: "POST",
        body,
      }),

      async onQueryStarted(
        { text, originalId, commentToId, responseToId, postId },
        { dispatch, queryFulfilled, getState }
      ) {
        const user = (getState() as RootState).auth.user;
        if (!user) return;

        const { data } = await queryFulfilled;
        dispatch(
          commentApi.util.updateQueryData("getComments", { postId, page: 0 }, (draft) => {
            commentsAdapter.addOne(draft.comments, {
              id: data.id,
              text,
              user,
              createdAt: new Date().toISOString(),
              updatedAt: null,
              originalId: originalId || null,
              commentToId: commentToId || null,
              responseToId: responseToId || null,
              comments: 0,
              likes: 0,
              dislikes: 0,
              reposts: 0,
              reaction: 0,
              responses: [],
            });
          })
        );
      },
    }),

    getCommentResponses: builder.mutation<
      DataResponse & { totalComments: number },
      { page: number; commentId: string; postId: string }
    >({
      query: ({ page, commentId, postId }) => ({
        url: `comment/${commentId}?page=${page}&postId=${postId}`,
        method: "GET",
      }),

      async onQueryStarted({ commentId, postId }, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(
          commentApi.util.updateQueryData("getComments", { postId, page: 0 }, (draft) => {
            const comment = commentsSelector.selectById(draft.comments, commentId);
            if (!comment) return;
            commentsAdapter.updateOne(draft.comments, {
              id: commentId,
              changes: {
                responses: [...comment.responses, ...data.comments],
                comments: data.total,
              },
            });
          })
        );
        dispatch(
          postApi.util.updateQueryData("getPosts", 0, (draft) => {
            postsAdapter.updateOne(draft.posts, {
              id: postId,
              changes: { comments: data.totalComments },
            });
          })
        );
        dispatch(
          postApi.util.updateQueryData("getPostById", postId, (draft) =>
            Object.assign(draft, { comments: data.totalComments })
          )
        );
      },
    }),
  }),
});

export const {
  useGetCommentsQuery,
  useCreateCommentMutation,
  useGetCommentResponsesMutation,
} = commentApi;
