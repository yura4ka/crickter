import { api } from "@/app/api/apiSlice";
import { EntityState, createEntityAdapter } from "@reduxjs/toolkit";

interface Tag {
  name: string;
  postCount: number;
  createdAt: string;
}

interface TagsResponse {
  tags: EntityState<Tag>;
  hasMore: boolean;
}

export const tagsAdapter = createEntityAdapter<Tag>({
  selectId: ({ name }) => name,
});
export const tagsSelector = tagsAdapter.getSelectors();

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

    getTags: builder.query<TagsResponse, number>({
      query: (page) => ({ url: `tags?page=${page}` }),
      transformResponse: ({ tags, hasMore }: { tags: Tag[]; hasMore: boolean }) => {
        return {
          tags: tagsAdapter.setMany(tagsAdapter.getInitialState(), tags),
          hasMore,
        };
      },
      serializeQueryArgs: ({ endpointName }) => {
        return endpointName;
      },
      merge: (currentCache, newItems) => {
        tagsAdapter.setMany(currentCache.tags, tagsSelector.selectAll(newItems.tags));
        currentCache.hasMore = newItems.hasMore;
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.tags.ids.map((id) => ({ type: "Tags" as const, id })),
              { type: "Tags", id: "LIST" },
            ]
          : [{ type: "Tags", id: "LIST" }],
    }),
  }),
});

export const { useGetPopularTagsQuery, useGetTagsQuery } = tagsApi;
