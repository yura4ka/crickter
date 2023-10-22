import { api } from "@/app/api/apiSlice";
import { EntityState, createEntityAdapter } from "@reduxjs/toolkit";
import { Post, PostsResponse, postsAdapter, postsSelector } from "../posts/postsApiSlice";

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

    getTagPosts: builder.query<PostsResponse, { tag: string; page: number }>({
      query: ({ tag, page }) => ({ url: `tags/${tag}/posts?page=${page}` }),
      transformResponse: ({ posts, hasMore }: { posts: Post[]; hasMore: boolean }) => {
        return {
          posts: postsAdapter.setMany(postsAdapter.getInitialState(), posts),
          hasMore,
        };
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        return endpointName + queryArgs.tag;
      },
      merge: (currentCache, newItems) => {
        postsAdapter.setMany(currentCache.posts, postsSelector.selectAll(newItems.posts));
        currentCache.hasMore = newItems.hasMore;
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
      providesTags: (result, _, { tag }) =>
        result
          ? [
              ...result.posts.ids.map((id) => ({ type: "Posts" as const, id, tag })),
              { type: "Posts", tag },
              { type: "Tags" },
            ]
          : [{ type: "Posts", tag }, { type: "Tags" }],
    }),
  }),
});

export const { useGetPopularTagsQuery, useGetTagsQuery, useGetTagPostsQuery } = tagsApi;
