import { Link, useNavigate, useParams } from "react-router-dom";
import { useGetTagPostsQuery } from "./tagsApiSlice";
import { useAuth } from "../auth/useAuth";
import { useRef, useState } from "react";
import { postsAdapter, postsSelector } from "../posts/postsApiSlice";
import { useInfiniteScroll } from "@/lib/hooks";
import { Hash } from "lucide-react";
import PostCard from "../posts/PostCard";
import { cn } from "@/lib/utils";

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
          <div key={p.id}>
            <PostCard
              post={p}
              fromTag={tag}
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
          className={hasMore || isFetching ? "" : "hidden"}
        />
      </div>
    </main>
  );
};

export default TagPostsPage;
