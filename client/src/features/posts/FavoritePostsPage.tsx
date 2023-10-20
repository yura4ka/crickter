import { useRef, useState } from "react";
import { useAuth } from "../auth/useAuth";
import {
  Post,
  postsAdapter,
  postsSelector,
  useGetFavoritePostsQuery,
} from "./postsApiSlice";
import { useInfiniteScroll } from "@/lib/hooks";
import PostCard from "./PostCard";
import RepostModal from "./RepostModal";

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

  const [currentRepost, setCurrentRepost] = useState<Post | null>(null);
  const [isRepostShown, setIsRepostShown] = useState(false);

  const handleRepostClick = (post: Post | undefined) => {
    if (!post) return;
    setCurrentRepost(post);
    setIsRepostShown(true);
  };

  return (
    <main className="sm:container">
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
    </main>
  );
};

export default FavoritePostsPage;
