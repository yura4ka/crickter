import { api } from "@/app/api/apiSlice";

interface PostsResponse {
  id: string;
}

interface CreatePostRequest {
  text: string;
  parentId?: string;
}

export const postApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPosts: builder.query<PostsResponse[], void>({
      query: () => ({ url: "post" }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: "Posts" as const, id: p.id })),
              { type: "Posts", id: "LIST" },
            ]
          : [{ type: "Posts", id: "LIST" }],
    }),
    createPost: builder.mutation<undefined, CreatePostRequest>({
      query: (body) => ({ url: "post", method: "POST", body }),
    }),
  }),
});

export const { useCreatePostMutation, useGetPostsQuery } = postApi;
