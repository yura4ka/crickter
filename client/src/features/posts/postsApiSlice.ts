import { api } from "@/app/api/apiSlice";
import { setReaction } from "./utils";
import { RootState } from "@/app/store";

interface PostUser {
  id: string;
  username: string;
}

export interface PostResponse {
  id: string;
  text: string;
  user: PostUser;
  createdAt: string;
  updatedAt: string | null;
  originalId: string | null;
  likes: number;
  dislikes: number;
  comments: number;
  reaction: -1 | 0 | 1;
}

interface CreatePostRequest {
  text: string;
  parentId?: string;
}

interface ReactionRequest {
  postId: string;
  liked: boolean;
}

export const postApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPostById: builder.query<PostResponse, string>({
      query: (id) => ({ url: `post/${id}` }),
      providesTags: (_result, _error, id) => [{ type: "Posts", id }],
    }),
    getPosts: builder.query<PostResponse[], void>({
      query: () => ({ url: "post" }),
      transformResponse: (baseQueryReturnValue: { posts: PostResponse[] }) => {
        return baseQueryReturnValue.posts;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: "Posts" as const, id: p.id })),
              { type: "Posts", id: "LIST" },
            ]
          : [{ type: "Posts", id: "LIST" }],
    }),
    createPost: builder.mutation<{ id: string }, CreatePostRequest>({
      query: (body) => ({ url: "post", method: "POST", body }),
      async onQueryStarted({ text, parentId }, { dispatch, queryFulfilled, getState }) {
        const user = (getState() as RootState).auth.user;
        if (!user) return;

        const { data } = await queryFulfilled;
        dispatch(
          postApi.util.updateQueryData("getPosts", undefined, (draft) => {
            draft.unshift({
              id: data.id,
              text,
              user: { id: user.id, username: user.username },
              createdAt: new Date().toISOString(),
              updatedAt: null,
              originalId: parentId || null,
              comments: 0,
              likes: 0,
              dislikes: 0,
              reaction: 0,
            });
          })
        );
      },
    }),
    processReaction: builder.mutation<undefined, ReactionRequest>({
      query: (body) => ({ url: "post/reaction", method: "POST", body }),
      async onQueryStarted({ postId, liked }, { dispatch, queryFulfilled }) {
        const patchResult1 = dispatch(
          postApi.util.updateQueryData("getPosts", undefined, (draft) => {
            const post = draft.find((p) => p.id === postId);
            setReaction(post, liked);
          })
        );
        const patchResult2 = dispatch(
          postApi.util.updateQueryData("getPostById", postId, (draft) =>
            setReaction(draft, liked)
          )
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult1.undo();
          patchResult2.undo();
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
