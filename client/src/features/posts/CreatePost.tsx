import { Loader2, Lock, Paperclip, Unlock } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { Link } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FC, useRef, useState } from "react";
import { Post, useCreatePostMutation } from "./postsApiSlice";
import SubmitButton from "@/components/SubmitButton";
import { cn } from "@/lib/utils";
import { PostType } from "./utils";
import { Input } from "@/components/ui/input";
import PostCard from "./PostCard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

const placeholders = [
  "Maxwell's equations",
  "Quantum interference",
  "Moiré pattern",
  "Bell's theorem",
  "Mott problem",
  "Quantum decoherence",
  "Objective-collapse theory",
  "Phase-space formulation",
  "Equilibrium constant",
  "SIT theory",
  "Standard enthalpy of reaction",
  "Le Chatelier's principle",
];

interface Props {
  type?: PostType;
  onPostCreated?: (text: string, parentId?: string) => void;
  commentToId?: string;
  responseToId?: string;
  originalId?: string;
  className?: string;
  repostOf?: Post;
}

const CreatePost: FC<Props> = ({
  onPostCreated,
  commentToId,
  responseToId,
  originalId,
  type = "post",
  className,
  repostOf,
}) => {
  const MAX_LENGTH = type === "post" ? 512 : 256;
  const placeholder = useRef(
    type === "comment" || repostOf
      ? "Add a comment..."
      : "Your opinion on " + placeholders[Math.floor(Math.random() * placeholders.length)]
  );

  const { isAuth, isLoading, user } = useAuth();

  const [value, setValue] = useState("");
  const [canComment, setCanComment] = useState(true);
  const [createPost, { isLoading: isCreating, isError }] = useCreatePostMutation();

  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (v.length === 0 || v.length > MAX_LENGTH) return;
    await createPost({
      text: v,
      commentToId,
      responseToId,
      originalId,
      canComment,
    }).unwrap();
    setValue("");
    onPostCreated?.(v);
  };

  if (isLoading) {
    return (
      <div className="grid place-content-center rounded border p-4">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!isAuth && type === "response") return <></>;

  if (!isAuth) {
    return (
      <div className={cn("rounded p-4", !repostOf && "border")}>
        <Link to={"/login"} className="link">
          Login
        </Link>{" "}
        or{" "}
        <Link to={"/register"} className="link">
          Sign up
        </Link>{" "}
        to {type === "post" ? "make a post" : "comment"}.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} ref={formRef} className={cn("flex gap-2", className)}>
      <Avatar className={cn(type === "response" && "hidden sm:block")}>
        {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
        <AvatarFallback>{user.username[0]}</AvatarFallback>
      </Avatar>
      <div className={cn("w-full", type === "response" && "items-center gap-2 sm:flex")}>
        {type !== "response" ? (
          <Textarea
            value={value}
            name="text"
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder.current}
            maxLength={MAX_LENGTH}
            className={cn(
              "scrollbar resize-none",
              isError && "border-destructive focus-visible:ring-destructive",
              repostOf &&
                "min-h-[20px] border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            )}
            onInput={(e) => {
              e.currentTarget.style.height = "";
              e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
            }}
            onKeyDown={(e) => {
              if (e.key !== "Enter" || e.shiftKey) return;
              formRef.current?.requestSubmit();
              e.preventDefault();
            }}
          />
        ) : (
          <Input
            value={value}
            name="text"
            onChange={(e) => setValue(e.target.value)}
            placeholder="Add a reply..."
            maxLength={MAX_LENGTH}
            className={cn(isError && "border-destructive focus-visible:ring-destructive")}
          />
        )}

        {repostOf && (
          <PostCard
            post={repostOf}
            fetchOriginal={false}
            hideControls={true}
            className="mb-4 rounded border pl-1"
            type="response"
          />
        )}

        <div
          className={cn(
            "mt-2 flex justify-between gap-2",
            type === "response" && "sm:mt-0"
          )}
        >
          <div className="flex min-h-min grow justify-between gap-1">
            <div className="flex">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={undefined}
                      className="h-6 w-6 p-1"
                    >
                      <Paperclip />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add attachment</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {type === "post" && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => setCanComment((prev) => !prev)}
                        className="h-6 w-6 p-1"
                      >
                        {canComment ? <Unlock /> : <Lock />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Other users {canComment ? "can" : "cannot"} comment on this post
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className={cn("self-center", type === "response" && "hidden")}>
              {value.length !== 0 && (
                <p className="text-xs text-muted-foreground">
                  {value.length}/{MAX_LENGTH}
                </p>
              )}
            </div>
          </div>
          <SubmitButton
            isLoading={isCreating}
            disabled={value.trim().length === 0 || value.length > MAX_LENGTH}
          >
            {type === "comment" || repostOf
              ? "Comment"
              : type === "response"
              ? "Reply"
              : "Post"}
          </SubmitButton>
        </div>
      </div>
    </form>
  );
};
export default CreatePost;
