import { useRef, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { postsAdapter, postsSelector, useSearchPostQuery } from "./postsApiSlice";
import { useSearchParams } from "react-router-dom";
import { useInfiniteScroll } from "@/lib/hooks";
import PostCard from "./PostCard";
import { SearchCheck } from "lucide-react";

const SearchPostsPage = () => {
  const { isLoading: isAuthLoading } = useAuth();
  const [params] = useSearchParams();
  const [page, setPage] = useState(1);
  const { posts, hasMore, isFetching } = useSearchPostQuery(
    { page, query: params.get("q")?.trim() ?? "" },
    {
      skip: isAuthLoading,
      selectFromResult: ({ data, ...other }) => ({
        posts: postsSelector.selectAll(data?.posts ?? postsAdapter.getInitialState()),
        hasMore: data?.hasMore,
        ...other,
      }),
    }
  );

  const isLoading = isFetching || isAuthLoading;

  const loaderDiv = useRef<HTMLDivElement>(null);
  useInfiniteScroll(loaderDiv, () => {
    if (hasMore && !isLoading) {
      setPage((p) => p + 1);
    }
  });

  return (
    <main className="sm:container">
      <h1 className="flex items-center gap-2 border-b p-4 text-xl font-bold">
        <SearchCheck /> Search result for: {params.get("q")}
      </h1>
      <div className="divide-y">
        {!isLoading && posts.length === 0 && (
          <div className="pt-4 text-center text-xl">Nothing here...</div>
        )}
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
        <PostCard
          ref={loaderDiv}
          post={undefined}
          className={hasMore || isLoading ? "" : "hidden"}
        />
      </div>
    </main>
  );
};

export default SearchPostsPage;
