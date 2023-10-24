import {
  Post,
  useGetPostByIdQuery,
  useHandleFavoriteMutation,
  useProcessReactionMutation,
} from "./postsApiSlice";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, formatTimeAgo, optimizeImageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MessageSquare, ThumbsDown, ThumbsUp, Repeat, Bookmark } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { FC, forwardRef } from "react";
import { PostType } from "./utils";
import { useAuth } from "../auth/useAuth";
import { useLoginModal } from "../loginModal/useLoginModal";
import { AvatarImage } from "@radix-ui/react-avatar";
import React from "react";
import { useRepostModal } from "./useRepostModal";

const hashtagRegex = /#(\w+)/;
const linkRegex = /(?:https?|ftp):\/\/[^\s/$.?#].[^\s]*/;

function formatText(text: string) {
  return text.split("\n").map((r, j) => (
    <p key={j}>
      {r.split(" ").map((s, i) => {
        const tag = s.match(hashtagRegex);
        if (tag)
          return (
            <React.Fragment key={i}>
              <Link to={`/tags/${tag[1].toLowerCase()}`} className="link">
                {s}
              </Link>{" "}
            </React.Fragment>
          );

        const url = s.match(linkRegex);
        if (url)
          return (
            <React.Fragment key={i}>
              <Link to={url[0]} target="__blank" className="link">
                {s}
              </Link>{" "}
            </React.Fragment>
          );
        if (r === "")
          return (
            <React.Fragment key={i}>
              <br />
            </React.Fragment>
          );
        return <React.Fragment key={i}>{s} </React.Fragment>;
      })}
    </p>
  ));
}

const MinimalOriginal: FC<{ post: Post | undefined }> = ({ post }) => {
  if (!post)
    return (
      <div>
        <Skeleton className="mb-1 h-3 w-[250px]" />
        <Skeleton className="mb-1 h-3 w-[200px]" />
      </div>
    );

  if (post.isDeleted)
    return (
      <a
        href={"#" + post.id}
        className="my-2 block border-l-4 pl-2 transition hover:bg-border"
      >
        <div className="italic text-muted-foreground">Deleted post</div>
      </a>
    );

  return (
    <a
      href={"#" + post.id}
      className="my-2 block border-l-4 pl-2 transition hover:bg-border"
    >
      <div className="font-medium">
        {post.user.isDeleted ? "Deleted user" : `@${post.user.username}`}
      </div>
      <div className="line-clamp-1">{formatText(post.text)}</div>
    </a>
  );
};

interface Props {
  post: Post | undefined;
  fetchOriginal?: boolean;
  className?: string;
  type?: PostType;
  hideControls?: boolean;
  onCommentClick?: () => void;
  fromTag?: string;
}

const PostCard = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const {
    post: p,
    fetchOriginal = true,
    className,
    onCommentClick,
    type = "post",
    hideControls,
    fromTag,
  } = props;

  const { isAuth } = useAuth();
  const { showModal } = useLoginModal();
  const { showModal: showRepost } = useRepostModal();

  const { data: original } = useGetPostByIdQuery(p?.originalId || "", {
    skip: !(fetchOriginal && !!p?.originalId),
  });

  const [handleReaction] = useProcessReactionMutation();
  const [handleFavorite] = useHandleFavoriteMutation();

  const onReactionClick = (liked: boolean) => {
    if (!p) return;
    if (!isAuth) {
      showModal();
      return;
    }
    handleReaction({ post: { ...p, fromTag }, liked });
  };

  const onFavoriteClick = () => {
    if (!p) return;
    if (!isAuth) {
      showModal();
      return;
    }
    handleFavorite({ ...p, fromTag });
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

  const created = formatTimeAgo(new Date(p.createdAt));
  const updated = p.updatedAt && formatTimeAgo(new Date(p.updatedAt));

  const avatar =
    p.isDeleted || p.user.isDeleted ? (
      <Avatar>
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    ) : (
      <Link to={`/user/${p.user.id}`}>
        <Avatar>
          {p.user.avatar && (
            <AvatarImage src={optimizeImageUrl(p.user.avatar.url, p.user.avatar.type)} />
          )}
          <AvatarFallback>{p.user.username[0]}</AvatarFallback>
        </Avatar>
      </Link>
    );

  const userData =
    p.isDeleted || p.user.isDeleted ? (
      <p className="text-base font-bold">Deleted User</p>
    ) : (
      <>
        <Link
          to={`/user/${p.user.id}`}
          className="break-all text-base font-bold text-foreground hover:underline"
        >
          {p.user.name}
        </Link>
        <Link to={`/user/${p.user.id}`} className="break-all hover:underline">
          @{p.user.username}
        </Link>
      </>
    );

  return (
    <article
      id={p.id}
      ref={ref}
      className={cn("flex gap-3 py-4 pr-2 sm:gap-4 sm:py-6 sm:pr-0", className)}
    >
      {avatar}
      <div className="grow">
        {!p.isDeleted && (
          <div className="mb-1 flex flex-wrap items-baseline gap-x-2 align-bottom text-sm text-muted-foreground">
            {userData}•<span>{created}</span>
            {updated && (
              <>
                •<span className="">ed. {updated}</span>
              </>
            )}
          </div>
        )}

        {fetchOriginal && p.originalId && type !== "post" && (
          <MinimalOriginal post={original} />
        )}
        <div style={{ wordBreak: "break-word" }} className="pb-1">
          {p.isDeleted ? (
            <p className="py-2 italic text-muted-foreground">Deleted post</p>
          ) : (
            formatText(p.text)
          )}
        </div>
        {fetchOriginal && p.originalId && type === "post" && (
          <PostCard
            post={original}
            fetchOriginal={false}
            className="my-2 rounded border p-2 sm:p-4"
          />
        )}
        <div className={cn("flex gap-1 sm:gap-4", hideControls && "hidden")}>
          <Button onClick={() => onReactionClick(true)} size={"icon"} variant={"ghost"}>
            <ThumbsUp
              className={cn("mr-2 h-4 w-4", p.reaction === 1 && "fill-reaction")}
            />
            {p.likes}
          </Button>
          <Button onClick={() => onReactionClick(false)} size={"icon"} variant={"ghost"}>
            <ThumbsDown
              className={cn("mr-2 h-4 w-4", p.reaction === -1 && "fill-reaction")}
            />
            {p.dislikes}
          </Button>
          <Button
            onClick={onCommentClick}
            asChild={!onCommentClick}
            size={"icon"}
            variant={"ghost"}
          >
            {onCommentClick !== undefined ? (
              <>
                <MessageSquare className="mr-2 h-4 w-4" />
                {type === "response" ? p.reposts : p.comments}
              </>
            ) : (
              <Link to={"/post/" + p.id}>
                <MessageSquare className="mr-2 h-4 w-4" />
                {type === "response" ? p.reposts : p.comments}
              </Link>
            )}
          </Button>
          {type === "post" && (
            <Button onClick={() => showRepost(p)} size={"icon"} variant={"ghost"}>
              <Repeat className="mr-2 h-4 w-4" />
              {p.reposts}
            </Button>
          )}
          {type === "post" && (
            <Button onClick={onFavoriteClick} size={"icon"} variant={"ghost"}>
              <Bookmark className={cn("h-4 w-4", p.isFavorite && "fill-reaction")} />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
});
export default PostCard;
