import { useRef, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { tagsAdapter, tagsSelector, useGetTagsQuery } from "./tagsApiSlice";
import { useInfiniteScroll } from "@/lib/hooks";
import { Hash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

const TagPage = () => {
  const { isLoading: isAuthLoading } = useAuth();
  const [page, setPage] = useState(1);
  const { tags, hasMore, isFetching } = useGetTagsQuery(page, {
    skip: isAuthLoading,
    selectFromResult: ({ data, ...other }) => ({
      tags: tagsSelector.selectAll(data?.tags ?? tagsAdapter.getInitialState()),
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
    <main className="sm:container">
      <h1 className="flex items-center gap-2 border-b p-4 text-xl font-bold">
        <Hash />
        trending tags
      </h1>
      <div className="mx-2 mt-4 grid gap-4 sm:mx-0">
        {tags.map((t) => (
          <Link
            key={t.name}
            to={`/tags/${t.name}`}
            className="rounded border p-2 transition-colors hover:bg-accent"
          >
            <p className="text-lg font-bold">#{t.name}</p>
            <p className="text-sm text-muted-foreground">{t.postCount} tweets</p>
            <p className="text-sm text-muted-foreground">
              First mention{" "}
              {new Date(t.createdAt).toLocaleDateString(undefined, {
                dateStyle: "medium",
              })}
            </p>
          </Link>
        ))}
        <div
          ref={loaderDiv}
          className={hasMore || isFetching ? "rounded border p-2" : "hidden"}
        >
          <Skeleton className="mb-1.5 h-[18px] w-[160px]" />
          <Skeleton className="h-[14px] w-[60px]" />
        </div>
      </div>
    </main>
  );
};

export default TagPage;
