import { useRef, useState } from "react";
import { useAuth } from "./features/auth/useAuth";
import CreatePost from "./features/posts/CreatePost";
import PostCard from "./features/posts/PostCard";
import {
  postsAdapter,
  postsSelector,
  useGetPostsQuery,
} from "./features/posts/postsApiSlice";
import { useInfiniteScroll } from "./lib/hooks";
import { useGetPopularTagsQuery } from "./features/tags/tagsApiSlice";
import { Link } from "react-router-dom";
import { Skeleton } from "./components/ui/skeleton";
import { Input } from "./components/ui/input";
import { Search } from "lucide-react";

const Feed = () => {
  const { isLoading: isAuthLoading } = useAuth();
  const [page, setPage] = useState(1);
  const { posts, hasMore, isFetching } = useGetPostsQuery(page, {
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
    <div className="divide-y">
      {posts.length === 0 && (
        <div className="pt-4 text-center text-xl">No posts here...</div>
      )}
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
      <PostCard
        ref={loaderDiv}
        post={undefined}
        className={hasMore || isFetching ? "" : "hidden"}
      />
    </div>
  );
};

const Trends = () => {
  const { data: tags, isLoading } = useGetPopularTagsQuery();

  return (
    <div className="mt-4 rounded-xl bg-accent text-accent-foreground">
      <h3 className="border-b border-accent-border p-2 text-xl font-bold">Trending</h3>
      <div className="divide-y divide-accent-border">
        {isLoading || !tags ? (
          <>
            <div className="p-2">
              <Skeleton className="mb-1.5 h-[18px] w-[160px] bg-accent-border" />
              <Skeleton className="h-[14px] w-[60px] bg-accent-border" />
            </div>
            <div className="p-2">
              <Skeleton className="mb-1.5 h-[18px] w-[160px] bg-accent-border" />
              <Skeleton className="h-[14px] w-[60px] bg-accent-border" />
            </div>
            <div className="p-2">
              <Skeleton className="mb-1.5 h-[18px] w-[160px] bg-accent-border" />
              <Skeleton className="h-[14px] w-[60px] bg-accent-border" />
            </div>
          </>
        ) : (
          tags.map((t) => (
            <Link
              to={`tags/${t.name}`}
              key={t.name}
              className="block p-2 transition-colors hover:bg-accent-border"
            >
              <p className="text-lg font-bold">#{t.name}</p>
              <p className="text-sm text-muted-foreground">{t.postCount} tweets</p>
            </Link>
          ))
        )}
        {tags && tags.length === 0 && (
          <p className="px-2 py-4 text-lg">Nothing here...</p>
        )}
      </div>
      {tags && tags.length !== 0 && (
        <Link to="tags" className="link block border-t border-accent-border p-2">
          Show more
        </Link>
      )}
    </div>
  );
};

const PostSearch = () => {
  return (
    <form className="relative">
      <Input name="search" placeholder="Search" className="bg-muted pl-9" />
      <Search className="absolute left-2 top-1/2 h-5 w-5 -translate-y-1/2" />
    </form>
  );
};

function App() {
  return (
    <div className="sm:container sm:flex">
      <aside className="flex flex-col p-4 sm:order-2 sm:w-1/4">
        <PostSearch />
        <Trends />
      </aside>
      <main className="overflow-x-hidden px-2 py-4 sm:w-3/4 sm:border-r sm:pl-0 sm:pr-4">
        <CreatePost />
        <hr className="mt-6" />
        <Feed />
      </main>
    </div>
  );
}

export default App;
