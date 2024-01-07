import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import {
  useChangeUserMutation,
  useGetUserPostsQuery,
  useGetUserQuery,
} from "./userApiSlice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCallback, useEffect, useRef, useState } from "react";
import { postsAdapter, postsSelector } from "../posts/slices/postsApiSlice";
import { useInfiniteScroll } from "@/lib/hooks";
import { PostCard } from "@/features/posts/components";
import { cn, optimizeImageUrl } from "@/lib/utils";
import SubscribeButton from "./SubscribeButton";
import {
  Dialog,
  DialogHeader,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import FollowersCard from "./FollowersCard";
import FollowingCard from "./FollowingCard";
import { Camera, Loader2 } from "lucide-react";
import { UploadCtxProvider } from "@uploadcare/blocks";
import { UploadEventDetails } from "@/lib/HeadlessModal";

const UserInfo = ({ id }: { id: string }) => {
  const { data: user, isLoading } = useGetUserQuery(id);
  const { isLoading: isAuthLoading, user: auth } = useAuth();
  const [changeUser] = useChangeUserMutation();

  const uploaderRef = useRef<UploadCtxProvider>(null);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);

  const handleAvatarChange = useCallback(
    (e: CustomEvent<UploadEventDetails>) => {
      const { detail } = e;
      if (detail.ctx !== "avatar-uploader") return;
      changeUser({
        avatar: {
          url: detail.data[0].cdnUrl ?? "",
          type: detail.data[0].contentInfo.mime.subtype,
        },
      });
      uploaderRef.current?.addFileFromObject;
    },
    [changeUser]
  );

  const onDoneFlow = () => uploaderRef.current?.uploadCollection.clearAll();

  useEffect(() => {
    window.addEventListener("LR_DATA_OUTPUT", handleAvatarChange);
    window.addEventListener("LR_DONE_FLOW", onDoneFlow);
    return () => {
      window.removeEventListener("LR_DATA_OUTPUT", handleAvatarChange);
      window.removeEventListener("LR_DONE_FLOW", onDoneFlow);
    };
  }, [handleAvatarChange]);

  if (!user || isLoading || isAuthLoading) {
    return (
      <section className="grid place-content-center">
        <Loader2 className="h-10 w-10 animate-spin" />
      </section>
    );
  }

  const secondary = (
    <>
      <div className="flex justify-between gap-1">
        <p>
          <span className="font-bold">{user.postCount}</span> posts
        </p>
        <Dialog open={followersOpen} onOpenChange={setFollowersOpen}>
          <DialogTrigger asChild>
            <button
              className="[&:not(:disabled)]:hover:underline"
              disabled={user.followers === 0}
            >
              <span className="font-bold">{user.followers}</span> followers
            </button>
          </DialogTrigger>
          <DialogContent className="scrollbar max-h-[100vh] overflow-y-scroll sm:m-4 sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Followers</DialogTitle>
            </DialogHeader>
            <FollowersCard userId={id} authId={auth?.id} setModal={setFollowersOpen} />
          </DialogContent>
        </Dialog>

        <Dialog open={followingOpen} onOpenChange={setFollowingOpen}>
          <DialogTrigger asChild>
            <button
              className="[&:not(:disabled)]:hover:underline"
              disabled={user.following === 0}
            >
              <span className="font-bold">{user.following}</span> following
            </button>
          </DialogTrigger>
          <DialogContent className="scrollbar max-h-[100vh] overflow-y-scroll sm:m-4 sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Following</DialogTitle>
            </DialogHeader>
            <FollowingCard userId={id} authId={auth?.id} setModal={setFollowingOpen} />
          </DialogContent>
        </Dialog>
      </div>
      <p className="text-base text-muted-foreground">
        {user.bio
          ? user.bio
          : user.id === auth?.id && (
              <Link to="/settings#bio" className="underline hover:text-foreground">
                Add bio
              </Link>
            )}
      </p>
      <p className="text-base">
        Joined on{" "}
        {new Date(user.createdAt).toLocaleDateString(undefined, {
          dateStyle: "medium",
        })}
      </p>
    </>
  );

  return (
    <>
      <header className="mx-auto flex max-w-xl sm:max-w-4xl">
        <div className="pr-4 sm:py-4 sm:pr-10 md:pr-20">
          <button
            onClick={() => uploaderRef.current?.initFlow()}
            disabled={user.id !== auth?.id}
            className="group relative"
          >
            <div
              className={cn(
                "absolute z-10 grid h-full w-full place-content-center rounded-full border-foreground opacity-0 transition-all group-hover:border group-hover:opacity-100",
                user.id !== auth?.id && "hidden"
              )}
            >
              <Camera className="stroke-zinc-50" />
            </div>
            <Avatar
              key={user.id}
              className={cn(
                "h-20 w-20 text-2xl transition-all sm:h-40 sm:w-40 sm:text-4xl",
                user.id === auth?.id && "group-hover:blur-sm group-hover:brightness-75"
              )}
            >
              {user.avatar && (
                <AvatarImage
                  src={optimizeImageUrl(user.avatar.url, user.avatar.type, {
                    scale: "160x160",
                    quality: "smart",
                  })}
                />
              )}
              <AvatarFallback>{user.username[0]}</AvatarFallback>
            </Avatar>
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-4 sm:text-lg">
          <div className="flex items-center justify-between gap-1">
            <div>
              <p className="break-all text-2xl">{user.name}</p>
              <p className="break-all text-base text-muted-foreground">
                @{user.username}
              </p>
            </div>
            <SubscribeButton
              isSubscribed={user.isSubscribed}
              size="lg"
              userId={id}
              className={id === auth?.id ? "hidden" : "hidden xs:flex"}
            />
          </div>
          <div className="hidden flex-col gap-4 xs:flex">{secondary}</div>
        </div>
      </header>
      <div className="mt-4 flex flex-col gap-2 xs:hidden">
        <SubscribeButton
          isSubscribed={user.isSubscribed}
          size="sm"
          userId={id}
          className={cn("mb-2", id === auth?.id && "hidden")}
        />
        {secondary}
      </div>
      <lr-upload-ctx-provider
        ctx-name="avatar-uploader"
        ref={uploaderRef}
      ></lr-upload-ctx-provider>
      <lr-data-output ctx-name="post-uploader" use-event></lr-data-output>
    </>
  );
};

const Feed = ({ id }: { id: string }) => {
  const { isLoading: isAuthLoading } = useAuth();
  const [page, setPage] = useState(1);
  const { posts, hasMore, isFetching } = useGetUserPostsQuery(
    { page, id },
    {
      skip: isAuthLoading,
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

  return (
    <div className="divide-y">
      {posts.length === 0 && !isLoading && (
        <div className="pt-4 text-center text-xl">No posts here...</div>
      )}
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
      <PostCard
        ref={loaderDiv}
        post={undefined}
        className={hasMore || isLoading ? "" : "hidden"}
      />
    </div>
  );
};

const UserPage = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { isError } = useGetUserQuery(userId ?? "");

  if (!userId || isError) {
    navigate("/");
    return <></>;
  }

  return (
    <div className="p-4 sm:p-6">
      <UserInfo id={userId} />
      <main className="mt-4 border-t sm:container sm:mt-12">
        <Feed id={userId} />
      </main>
    </div>
  );
};

export default UserPage;
