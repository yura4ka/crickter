import { useRef, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import {
  postsAdapter,
  postsSelector,
  useGetFavoritePostsQuery,
} from "../slices/postsApiSlice";
import { useInfiniteScroll } from "@/lib/hooks";
import { PostCard } from "@/features/posts/components";
import { Bookmark } from "lucide-react";

const FavoritePostsPage = () => {
  const { isLoading: isAuthLoading } = useAuth();
  const [page, setPage] = useState(1);
  const { posts, hasMore, isFetching } = useGetFavoritePostsQuery(page, {
    skip: isAuthLoading,
    selectFromResult: ({ data, ...other }) => ({
      posts: postsSelector.selectAll(data?.posts ?? postsAdapter.getInitialState()),
      hasMore: data?.hasMore,
      ...other,
    }),
  });

  const isLoading = isFetching || isAuthLoading;

  const loaderDiv = useRef<HTMLDivElement>(null);
  useInfiniteScroll(loaderDiv, () => {
    if (hasMore && !isLoading) {
      setPage((p) => p + 1);
    }
  });

  return (
    <>
      <h1 className="flex items-center gap-2 border-b p-4 pt-0 text-xl font-bold">
        <Bookmark className="fill-reaction" />
        favorite posts
      </h1>
      {posts.length === 0 && !isLoading && (
        <div className="pt-4 text-center text-xl">
          You don't have any favorite posts now...
        </div>
      )}
      <div className="divide-y">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
        <PostCard
          ref={loaderDiv}
          post={undefined}
          className={hasMore || isLoading ? "" : "hidden"}
        />
      </div>
    </>
  );
};

export { FavoritePostsPage };
