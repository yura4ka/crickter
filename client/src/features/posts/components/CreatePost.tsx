import { Loader2, Lock, Paperclip, Unlock } from "lucide-react";
import { useAuth } from "../../auth/useAuth";
import { Link } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FC, useCallback, useEffect, useId, useRef, useState } from "react";
import {
  NormalPost,
  Post,
  PostMedia,
  useChangePostMutation,
  useCreatePostMutation,
} from "../slices/postsApiSlice";
import SubmitButton from "@/components/SubmitButton";
import { cn, optimizeImageUrl } from "@/lib/utils";
import { PostType, WithOrigin } from "../slices/utils";
import { Input } from "@/components/ui/input";
import { PostCard } from "./";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { UploadEventDetails } from "@/lib/HeadlessModal";
import { UploadCtxProvider } from "@uploadcare/blocks";
import { Uploader } from "./Uploader";

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

function getSubmitButtonText(
  type: PostType | undefined,
  isEditing: boolean,
  isRepost: boolean
) {
  if (isEditing) return "Edit";
  if (isRepost) return "Repost";

  switch (type) {
    case "comment":
      return "Comment";
    case "response":
      return "Reply";
    default:
      return "Post";
  }
}

interface Props {
  type?: PostType;
  onSubmitted?: () => void;
  commentToId?: string;
  responseToId?: string;
  originalId?: string;
  className?: string;
  repostOf?: Post;
  edit?: WithOrigin<NormalPost>;
}

const CreatePost: FC<Props> = ({
  onSubmitted,
  commentToId,
  responseToId,
  originalId,
  type = "post",
  className,
  repostOf,
  edit,
}) => {
  const MAX_LENGTH = type === "post" ? 512 : 256;
  const placeholder = useRef(
    type === "comment" || repostOf
      ? "Add a comment..."
      : "Your opinion on " + placeholders[Math.floor(Math.random() * placeholders.length)]
  );

  const { isAuth, isLoading, user, ucareToken, expire } = useAuth();
  const id = useId();
  const isMediaInit = useRef(false);

  const [value, setValue] = useState(edit?.text ?? "");
  const [canComment, setCanComment] = useState(edit?.canComment ?? true);
  const [media, setMedia] = useState<PostMedia[]>(() => edit?.media ?? []);

  const [createPost, { isLoading: isCreating, isError: isCreateError }] =
    useCreatePostMutation();
  const [changePost, { isLoading: isUpdating, isError: isUpdateError }] =
    useChangePostMutation();

  const isError = isCreateError || isUpdateError;

  const formRef = useRef<HTMLFormElement>(null);
  const uploaderRef = useRef<UploadCtxProvider>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleUpload = useCallback(
    (e: CustomEvent<UploadEventDetails>) => {
      const { detail } = e;
      if (detail.ctx !== id) return;
      setMedia(
        detail.data.map((f) => ({
          id: f.uuid,
          url: f.cdnUrl,
          urlModifiers: f.cdnUrlModifiers,
          type: f.contentInfo.mime.type,
          mime: f.contentInfo.mime.mime,
          subtype: f.contentInfo.mime.subtype,
          height: f.imageInfo.height,
          width: f.imageInfo.width,
        }))
      );
    },
    [id]
  );

  const initMedia = useCallback(() => {
    if (!uploaderRef.current || !edit || isMediaInit.current) return;

    edit.media.forEach((m) =>
      uploaderRef.current?.addFileFromUuid(m.id, { silent: true })
    );

    if (edit.media.length !== 0)
      uploaderRef.current.$["*currentActivity"] = "upload-list";
    isMediaInit.current = true;
  }, [edit]);

  useEffect(() => {
    window.addEventListener("LR_DATA_OUTPUT", handleUpload);
    window.addEventListener("LR_INIT_FLOW", initMedia);
    return () => {
      window.removeEventListener("LR_DATA_OUTPUT", handleUpload);
      window.removeEventListener("LR_INIT_FLOW", initMedia);
    };
  }, [handleUpload, initMedia]);

  const resizeTextArea = (element: HTMLTextAreaElement, reset = false) => {
    element.style.height = "";
    if (!reset) element.style.height = element.scrollHeight + "px";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (v.length > MAX_LENGTH || (v.length === 0 && media.length === 0)) return;

    if (!edit)
      await createPost({
        text: v,
        commentToId,
        responseToId,
        originalId,
        canComment,
        media,
      }).unwrap();
    else
      await changePost({ post: edit, changes: { text: v, canComment, media } }).unwrap();
    setValue("");
    setMedia([]);
    if (textareaRef.current) resizeTextArea(textareaRef.current, true);
    uploaderRef.current?.uploadCollection.clearAll();
    onSubmitted?.();
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

  const parsedMedia = (
    <div className={cn("flex flex-wrap gap-2", media.length && "mt-2")}>
      {media.map((f) => (
        <div key={f.id}>
          {f.type === "image" && (
            <picture>
              <source srcSet={optimizeImageUrl(f.url, f.subtype, { scale: "100x100" })} />
              <img
                width={100}
                height={100}
                src={optimizeImageUrl(f.url, f.subtype, {
                  scale: "100x100",
                  format: "preserve",
                })}
              />
            </picture>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} ref={formRef} className={cn("grid gap-2", className)}>
      <div className="flex gap-2">
        <Avatar className={cn(type === "response" && "hidden sm:block")}>
          {user.avatar && (
            <AvatarImage
              src={optimizeImageUrl(user.avatar.url, user.avatar.type, {
                scale: "40x40",
              })}
            />
          )}
          <AvatarFallback>{user.username[0]}</AvatarFallback>
        </Avatar>
        <div
          className={cn("w-full", type === "response" && "items-center gap-2 sm:flex")}
        >
          {type !== "response" ? (
            <Textarea
              ref={textareaRef}
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
              onInput={(e) => resizeTextArea(e.currentTarget)}
              onFocus={(e) => resizeTextArea(e.currentTarget)}
              autoFocus={!!edit}
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
              className={cn(
                isError && "border-destructive focus-visible:ring-destructive"
              )}
            />
          )}

          {repostOf && (
            <PostCard
              post={repostOf}
              fetchOriginal={false}
              hideControls={true}
              className="mb-4 rounded border pl-1"
            />
          )}

          {type !== "response" && parsedMedia}

          <div
            className={cn(
              "mt-2 flex justify-between gap-2",
              type === "response" && "sm:mt-0"
            )}
          >
            <div
              className={cn(
                "flex min-h-min grow justify-between gap-1",
                type === "response" && "items-center"
              )}
            >
              <div className="flex">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => uploaderRef.current?.initFlow()}
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
            {edit && (
              <Button
                onClick={onSubmitted}
                disabled={isUpdating}
                variant="secondary"
                type="button"
              >
                Cancel
              </Button>
            )}
            <SubmitButton
              isLoading={isCreating || isUpdating}
              disabled={
                value.length > MAX_LENGTH ||
                (value.trim().length === 0 && media.length === 0)
              }
            >
              {getSubmitButtonText(type, !!edit, !!repostOf)}
            </SubmitButton>
          </div>
        </div>
      </div>
      <div className="">
        {type === "response" && parsedMedia}
        <Uploader
          ref={uploaderRef}
          ctxName={id}
          ucareToken={ucareToken}
          expire={expire}
        />
      </div>
    </form>
  );
};

export { CreatePost };
