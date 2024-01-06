import { useRef, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { postsAdapter, postsSelector, useSearchPostQuery } from "./postsApiSlice";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useInfiniteScroll } from "@/lib/hooks";
import PostCard from "./PostCard";
import { SearchCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const SearchPostsPage = () => {
  const { isLoading: isAuthLoading } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const query = params.get("q")?.trim();

  const [page, setPage] = useState(1);
  const { posts, hasMore, isFetching } = useSearchPostQuery(
    { page, query: query ?? "" },
    {
      skip: isAuthLoading || !query,
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

  if (!query) navigate("/");

  return (
    <main className="sm:container">
      <h1 className="flex items-center gap-2 border-b p-4 text-xl font-bold">
        <SearchCheck /> Search result for: {query}
      </h1>
      <div className="divide-y">
        {!isLoading && posts.length === 0 && (
          <div className="pt-4 text-center text-xl">Nothing here...</div>
        )}
        {posts.map((p) => (
          <div key={p.id}>
            <PostCard
              post={p}
              from={{ search: query }}
              type={p.commentToId ? "comment" : "post"}
              className={cn(p.commentToId && "pb-0 sm:pb-0")}
            />
            {p.commentToId && (
              <Link to={"/post/" + p.commentToId} className="link mb-2 inline-block px-2">
                view thread
              </Link>
            )}
          </div>
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
