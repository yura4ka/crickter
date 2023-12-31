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

  const isLoading = isFetching || isAuthLoading;

  const loaderDiv = useRef<HTMLDivElement>(null);
  useInfiniteScroll(loaderDiv, () => {
    if (hasMore && !isLoading) {
      setPage((p) => p + 1);
    }
  });

  return (
    <>
      <h1 className="flex items-center gap-2 border-b p-4 pt-0 text-xl font-bold">
        <Hash />
        trending tags
      </h1>
      {!isLoading && tags.length === 0 && (
        <div className="pt-4 text-center text-xl">Nothing here...</div>
      )}
      <div className="mt-4 grid gap-4">
        {tags.map((t) => (
          <Link
            key={t.name}
            to={`/tags/${t.name}`}
            className="rounded border p-2 transition-colors hover:bg-accent"
          >
            <p className="text-lg font-bold">#{t.name}</p>
            <p className="text-sm text-muted-foreground">{t.postCount} posts</p>
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
          className={hasMore || isLoading ? "rounded border p-2" : "hidden"}
        >
          <Skeleton className="mb-1.5 h-[18px] w-[160px]" />
          <Skeleton className="h-[14px] w-[60px]" />
        </div>
      </div>
    </>
  );
};

export default TagPage;
