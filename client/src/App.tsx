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

function App() {
  return (
    <div className="sm:container sm:flex">
      <aside className="flex flex-col p-4 sm:order-2 sm:w-1/4">
        <input type="search" className="bg-accent" placeholder="search" />
        <div className="mt-4 rounded bg-accent p-2 text-accent-foreground">
          <h3>Trending</h3>
          <div>
            <p>abc</p>
            <p>bcd</p>
            <p>efg</p>
          </div>
          <p className="link">Show more</p>
        </div>
      </aside>
      <main className="px-2 py-4 sm:w-3/4 sm:border-r sm:pl-0 sm:pr-4">
        <CreatePost />
        <hr className="mt-6" />
        <Feed />
      </main>
    </div>
  );
}

export default App;
