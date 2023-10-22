import { useRef, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { postsAdapter, postsSelector, useGetFavoritePostsQuery } from "./postsApiSlice";
import { useInfiniteScroll } from "@/lib/hooks";
import PostCard from "./PostCard";
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

  const loaderDiv = useRef<HTMLDivElement>(null);
  useInfiniteScroll(loaderDiv, () => {
    if (hasMore && !isFetching && !isAuthLoading) {
      setPage((p) => p + 1);
    }
  });

  return (
    <main className="sm:container">
      <h1 className="flex items-center gap-2 border-b p-4 text-xl font-bold">
        <Bookmark className="fill-reaction" />
        favorite posts
      </h1>
      {posts.length === 0 && !isFetching && (
        <div className="px-2 pt-4 text-center text-xl">
          You don't have any favorite posts now...
        </div>
      )}
      <div className="divide-y px-4 sm:px-4">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
        <PostCard
          ref={loaderDiv}
          post={undefined}
          className={hasMore || isFetching ? "" : "hidden"}
        />
      </div>
    </main>
  );
};

export default FavoritePostsPage;
