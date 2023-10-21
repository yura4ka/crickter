import { api } from "@/app/api/apiSlice";
import { Post, PostsResponse, postsAdapter, postsSelector } from "../posts/postsApiSlice";
import { EntityState, createEntityAdapter } from "@reduxjs/toolkit";
import { RootState } from "@/app/store";

export interface BaseUser {
  id: string;
  name: string;
  username: string;
  createdAt: string;
  isPrivate: boolean;
  isSubscribed: boolean;
  avatarUrl: string | null;
}

interface User extends BaseUser {
  followers: number;
  following: number;
  postCount: number;
  bio: string | null;
}

interface UsersResponse {
  users: EntityState<BaseUser>;
  hasMore: boolean;
}

export const followersAdapter = createEntityAdapter<BaseUser>();
export const followersSelector = followersAdapter.getSelectors();

export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUser: builder.query<User, string>({
      query: (id) => ({ url: "user/" + id }),
      providesTags: (_result, _error, id) => [{ type: "Users", id }],
    }),

    follow: builder.mutation<undefined, string>({
      query: (id) => ({
        url: `user/${id}/follow`,
        method: "POST",
        responseHandler: (response) => response.text(),
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled, getState }) {
        const user = (getState() as RootState).auth.user;
        if (!user) return;
        const patches = [
          dispatch(
            userApi.util.updateQueryData("getUser", id, (draft) => {
              draft.followers++;
              draft.isSubscribed = true;
            })
          ),
          dispatch(
            userApi.util.updateQueryData(
              "getUser",
              user.id,
              (draft) => void draft.following++
            )
          ),
        ];
        try {
          await queryFulfilled;
        } catch {
          patches.forEach((p) => p.undo());
        }
      },
    }),

    unfollow: builder.mutation<undefined, string>({
      query: (id) => ({
        url: `user/${id}/unfollow`,
        method: "POST",
        responseHandler: (response) => response.text(),
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled, getState }) {
        const user = (getState() as RootState).auth.user;
        if (!user) return;
        const patch1 = dispatch(
          userApi.util.updateQueryData("getUser", id, (draft) => {
            draft.followers--;
            draft.isSubscribed = false;
          })
        );
        const patch2 = dispatch(
          userApi.util.updateQueryData(
            "getUser",
            user.id,
            (draft) => void draft.following--
          )
        );
        try {
          await queryFulfilled;
        } catch {
          patch1.undo();
          patch2.undo();
        }
      },
    }),

    getUserPosts: builder.query<PostsResponse, { id: string; page: number }>({
      query: ({ page, id }) => ({ url: `user/${id}/posts?page=${page}` }),
      transformResponse: ({ posts, hasMore }: { posts: Post[]; hasMore: boolean }) => {
        return {
          posts: postsAdapter.setMany(postsAdapter.getInitialState(), posts),
          hasMore,
        };
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        return endpointName + queryArgs.id;
      },
      merge: (currentCache, newItems) => {
        postsAdapter.setMany(currentCache.posts, postsSelector.selectAll(newItems.posts));
        currentCache.hasMore = newItems.hasMore;
      },
      forceRefetch({ currentArg, previousArg }) {
        return (
          currentArg?.page !== previousArg?.page || currentArg?.id !== previousArg?.id
        );
      },
      providesTags: (result, _, { id }) =>
        result
          ? [
              ...result.posts.ids.map((id) => ({ type: "Posts" as const, id })),
              { type: "Posts", userId: id },
            ]
          : [{ type: "Posts", userId: id }],
    }),
    getFollowers: builder.query<UsersResponse, { id: string; page: number }>({
      query: ({ page, id }) => ({ url: `user/${id}/followers?page=${page}` }),
      keepUnusedDataFor: 0,
      transformResponse: (r: { users: BaseUser[]; hasMore: boolean }) => ({
        users: followersAdapter.setMany(followersAdapter.getInitialState(), r.users),
        hasMore: r.hasMore,
      }),
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        return endpointName + queryArgs.id;
      },
      merge: (currentCache, newItems) => {
        followersAdapter.setMany(
          currentCache.users,
          followersSelector.selectAll(newItems.users)
        );
        currentCache.hasMore = newItems.hasMore;
      },
      forceRefetch({ currentArg, previousArg }) {
        return (
          currentArg?.page !== previousArg?.page || currentArg?.id !== previousArg?.id
        );
      },
    }),

    getFollowing: builder.query<UsersResponse, { id: string; page: number }>({
      query: ({ page, id }) => ({ url: `user/${id}/following?page=${page}` }),
      keepUnusedDataFor: 0,
      transformResponse: (r: { users: BaseUser[]; hasMore: boolean }) => ({
        users: followersAdapter.setMany(followersAdapter.getInitialState(), r.users),
        hasMore: r.hasMore,
      }),
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        return endpointName + queryArgs.id;
      },
      merge: (currentCache, newItems) => {
        followersAdapter.setMany(
          currentCache.users,
          followersSelector.selectAll(newItems.users)
        );
        currentCache.hasMore = newItems.hasMore;
      },
      forceRefetch({ currentArg, previousArg }) {
        return (
          currentArg?.page !== previousArg?.page || currentArg?.id !== previousArg?.id
        );
      },
    }),
  }),
});

export const {
  useGetUserQuery,
  useGetUserPostsQuery,
  useFollowMutation,
  useUnfollowMutation,
  useGetFollowersQuery,
  useGetFollowingQuery,
} = userApi;
