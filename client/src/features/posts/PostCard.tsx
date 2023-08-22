import { Post, useGetPostByIdQuery, useProcessReactionMutation } from "./postsApiSlice";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, formatTimeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MessageSquare, ThumbsDown, ThumbsUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { forwardRef } from "react";

interface Props {
  post: Post | undefined;
  fetchOriginal?: boolean;
  className?: string;
}

const PostCard = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const { post: p, fetchOriginal = true, className } = props;

  const { data: original } = useGetPostByIdQuery(p?.originalId || "", {
    skip: !(fetchOriginal && !!p?.originalId),
  });

  const [handleReaction] = useProcessReactionMutation();

  const onReactionClick = (postId: string, liked: boolean) => {
    handleReaction({ postId, liked });
  };

  if (p === undefined) {
    return (
      <article
        ref={ref}
        className={cn("flex gap-3 py-4 pr-2 sm:gap-4 sm:py-6 sm:pr-0", className)}
      >
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <div className="w-full">
          <Skeleton className="mb-1 h-4 w-[250px]" />
          <Skeleton className="mb-1 h-4 w-[200px]" />
        </div>
      </article>
    );
  }

  return (
    <article
      ref={ref}
      className={cn("flex gap-3 py-4 pr-2 sm:gap-4 sm:py-6 sm:pr-0", className)}
    >
      <Avatar>
        <AvatarFallback>{p.user.username[0]}</AvatarFallback>
      </Avatar>
      <div className="grow">
        <p className="mb-1 flex items-baseline gap-2 align-bottom text-sm text-muted-foreground">
          <span className="text-base font-bold text-foreground">{p.user.name}</span>
          <span>@{p.user.username}</span>•
          <span>{formatTimeAgo(new Date(p.createdAt))}</span>
          {p.updatedAt !== null && (
            <>
              •<span>ed. {formatTimeAgo(new Date(p.updatedAt))}</span>
            </>
          )}
        </p>
        <p style={{ wordBreak: "break-word" }} className="pb-1">
          {p.text}
        </p>
        {p.originalId && (
          <PostCard
            post={original}
            fetchOriginal={false}
            className="my-2 rounded border p-2 sm:p-4 "
          />
        )}
        <div className="flex gap-4">
          <Button
            onClick={() => onReactionClick(p.id, true)}
            size={"icon"}
            variant={"ghost"}
          >
            <ThumbsUp
              className="mr-2 h-4 w-4"
              {...(p.reaction === 1 && { fill: "hsl(var(--reaction))" })}
            />
            {p.likes}
          </Button>
          <Button
            onClick={() => onReactionClick(p.id, false)}
            size={"icon"}
            variant={"ghost"}
          >
            <ThumbsDown
              className="mr-2 h-4 w-4"
              {...(p.reaction === -1 && { fill: "hsl(var(--reaction))" })}
            />
            {p.dislikes}
          </Button>
          <Button asChild size={"icon"} variant={"ghost"}>
            <Link to={"/post/" + p.id}>
              <MessageSquare className="mr-2 h-4 w-4" />
              {p.comments}
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
});
export default PostCard;
