import { useRef, useState } from "react";
import { useAuth } from "./features/auth/useAuth";
import CreatePost from "./features/posts/CreatePost";
import PostCard from "./features/posts/PostCard";
import {
  Post,
  postsAdapter,
  postsSelector,
  useGetPostsQuery,
} from "./features/posts/postsApiSlice";
import { useInfiniteScroll } from "./lib/hooks";
import RepostModal from "./features/posts/RepostModal";
import { useGetPopularTagsQuery } from "./features/tags/tagsApiSlice";
import { Link } from "react-router-dom";
import { Skeleton } from "./components/ui/skeleton";

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

  const [currentRepost, setCurrentRepost] = useState<Post | null>(null);
  const [isRepostShown, setIsRepostShown] = useState(false);

  const handleRepostClick = (post: Post | undefined) => {
    if (!post) return;
    setCurrentRepost(post);
    setIsRepostShown(true);
  };

  return (
    <div className="divide-y">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} onRepostClick={handleRepostClick} />
      ))}
      <PostCard
        ref={loaderDiv}
        post={undefined}
        className={hasMore || isFetching ? "" : "hidden"}
      />
      <RepostModal
        post={currentRepost}
        isOpen={isRepostShown}
        setOpen={setIsRepostShown}
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
              to={`tags/#${t.name}`}
              key={t.name}
              className="block p-2 transition-colors hover:bg-accent-border"
            >
              <p className="text-lg font-bold">#{t.name}</p>
              <p className="text-sm text-muted-foreground">{t.postCount} tweets</p>
            </Link>
          ))
        )}
      </div>
      <Link to="tags" className="link block border-t border-accent-border p-2">
        Show more
      </Link>
    </div>
  );
};

function App() {
  return (
    <div className="sm:container sm:flex">
      <aside className="flex flex-col p-4 sm:order-2 sm:w-1/4">
        <input type="search" className="bg-accent" placeholder="search" />
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
