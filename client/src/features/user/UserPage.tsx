import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import {
  useGetUserPostsQuery,
  useGetUserQuery,
  userPostsAdapter,
  userPostsSelector,
} from "./userApiSlice";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRef, useState } from "react";
import { Post } from "../posts/postsApiSlice";
import { useInfiniteScroll } from "@/lib/hooks";
import PostCard from "../posts/PostCard";
import RepostModal from "../posts/RepostModal";
import { cn } from "@/lib/utils";
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
import { Loader2 } from "lucide-react";

const UserInfo = ({ id }: { id: string }) => {
  const { data: user, isLoading } = useGetUserQuery(id);
  const { isLoading: isAuthLoading, user: auth } = useAuth();

  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);

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
            <button className="hover:underline">
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
            <button className="hover:underline">
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
      <p className="text-base text-muted-foreground">Add bio</p>
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
          <Avatar className="h-20 w-20 text-2xl sm:h-40 sm:w-40 sm:text-4xl">
            <AvatarFallback>{user.username[0]}</AvatarFallback>
          </Avatar>
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
    </>
  );
};

const Feed = ({ id }: { id: string }) => {
  const [page, setPage] = useState(1);
  const { posts, hasMore, isFetching } = useGetUserPostsQuery(
    { page, id },
    {
      selectFromResult: ({ data, ...other }) => ({
        posts: userPostsSelector.selectAll(
          data?.posts ?? userPostsAdapter.getInitialState()
        ),
        hasMore: data?.hasMore,
        ...other,
      }),
    }
  );
  const loaderDiv = useRef<HTMLDivElement>(null);
  useInfiniteScroll(loaderDiv, () => {
    if (hasMore && !isFetching) {
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

  return (
    <div className="divide-y">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} onRepostClick={handleRepostClick} />
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
  );
};

const UserPage = () => {
  const navigate = useNavigate();
  const { isLoading: isAuthLoading } = useAuth();
  const { userId } = useParams();

  if (!userId) {
    navigate("/");
    return <></>;
  }

  if (isAuthLoading) {
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
