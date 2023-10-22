import { useNavigate, useParams } from "react-router-dom";
import { useGetTagPostsQuery } from "./tagsApiSlice";
import { useAuth } from "../auth/useAuth";
import { useRef, useState } from "react";
import { Post, postsAdapter, postsSelector } from "../posts/postsApiSlice";
import { useInfiniteScroll } from "@/lib/hooks";
import { Hash } from "lucide-react";
import PostCard from "../posts/PostCard";
import RepostModal from "../posts/RepostModal";

const TagPostsPage = () => {
  const { tag } = useParams();
  const navigate = useNavigate();
  const { isLoading: isAuthLoading } = useAuth();
  const [page, setPage] = useState(1);
  const { posts, hasMore, isFetching } = useGetTagPostsQuery(
    { tag: tag ?? "", page },
    {
      skip: !tag || isAuthLoading,
      selectFromResult: ({ data, ...other }) => ({
        posts: postsSelector.selectAll(data?.posts ?? postsAdapter.getInitialState()),
        hasMore: data?.hasMore,
        ...other,
      }),
    }
  );

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

  if (!tag) {
    navigate("/");
    return <></>;
  }

  return (
    <main className="sm:container">
      <h1 className="flex items-center gap-2 border-b p-4 text-xl font-bold">
        <Hash />
        {tag}
      </h1>
      {posts.length === 0 && !isFetching && (
        <div className="px-2 pt-4 text-center text-xl">
          There aren't any posts with this tags...
        </div>
      )}
      <div className="divide-y px-4 sm:px-4">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} fromTag={tag} onRepostClick={handleRepostClick} />
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

export default TagPostsPage;
