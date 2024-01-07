import { Link, useNavigate, useParams } from "react-router-dom";
import { useGetTagPostsQuery } from "./tagsApiSlice";
import { useAuth } from "../auth/useAuth";
import { useRef, useState } from "react";
import { postsAdapter, postsSelector } from "../posts/slices/postsApiSlice";
import { useInfiniteScroll } from "@/lib/hooks";
import { Hash } from "lucide-react";
import { PostCard } from "@/features/posts/components";
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

  const isLoading = isFetching || isAuthLoading;

  const loaderDiv = useRef<HTMLDivElement>(null);
  useInfiniteScroll(loaderDiv, () => {
    if (hasMore && !isLoading) {
      setPage((p) => p + 1);
    }
  });

  if (!tag) {
    navigate("/");
    return <></>;
  }

  return (
    <>
      <h1 className="flex items-center gap-2 border-b p-4 pt-0 text-xl font-bold">
        <Hash />
        {tag}
      </h1>
      {!isLoading && posts.length === 0 && (
        <div className="px-2 pt-4 text-center text-xl">
          There aren't any posts with this tags...
        </div>
      )}
      <div className="divide-y">
        {posts.map((p) => (
          <div key={p.id}>
            <PostCard
              post={p}
              from={{ tag }}
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
    </>
  );
};

export default TagPostsPage;
