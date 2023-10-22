import { api } from "@/app/api/apiSlice";

interface Tag {
  name: string;
  postCount: number;
}

export const tagsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPopularTags: builder.query<Tag[], void>({
      query: () => ({ url: "tags/popular" }),
      transformResponse: ({ tags }: { tags: Tag[] }) => tags,
      providesTags: (result) =>
        result
          ? [
              ...result.map((name) => ({ type: "Tags" as const, name })),
              { type: "Tags", id: "POPULAR" },
            ]
          : [{ type: "Tags", id: "POPULAR" }],
    }),
  }),
});

export const { useGetPopularTagsQuery } = tagsApi;
