import { useRef, useState } from "react";
import { useAuth } from "./features/auth/useAuth";
import { CreatePost, PostCard } from "@/features/posts/components";
import {
  postsAdapter,
  postsSelector,
  useGetPostsQuery,
} from "./features/posts/slices/postsApiSlice";
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

  const isLoading = isFetching || isAuthLoading;

  const loaderDiv = useRef<HTMLDivElement>(null);
  useInfiniteScroll(loaderDiv, () => {
    if (hasMore && !isLoading) {
      setPage((p) => p + 1);
    }
  });

  return (
    <div className="divide-y">
      {!isLoading && posts.length === 0 && (
        <div className="pt-4 text-center text-xl">No posts here...</div>
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
  );
};

function App() {
  return (
    <>
      <CreatePost />
      <hr className="mt-6" />
      <Feed />
    </>
  );
}

export default App;
