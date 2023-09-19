import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import {
  useFollowMutation,
  useGetUserPostsQuery,
  useGetUserQuery,
  useUnfollowMutation,
  userPostsAdapter,
  userPostsSelector,
} from "./userApiSlice";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FC, useRef, useState } from "react";
import { Post } from "../posts/postsApiSlice";
import { useInfiniteScroll } from "@/lib/hooks";
import PostCard from "../posts/PostCard";
import RepostModal from "../posts/RepostModal";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size: "sm" | "lg";
  isSubscribed: boolean;
  userId: string;
}

const SubscribeButton: FC<ButtonProps> = ({ isSubscribed, size, userId, ...rest }) => {
  const [follow] = useFollowMutation();
  const [unfollow] = useUnfollowMutation();

  return isSubscribed ? (
    <Button onClick={() => unfollow(userId)} size={size} variant="secondary" {...rest}>
      Following
    </Button>
  ) : (
    <Button onClick={() => follow(userId)} size={size} {...rest}>
      Follow
    </Button>
  );
};

const UserInfo = ({ id }: { id: string }) => {
  const { data: user, isLoading } = useGetUserQuery(id);
  const { isLoading: isAuthLoading, user: auth } = useAuth();

  if (!user || isLoading || isAuthLoading) {
    return <section></section>;
  }

  const secondary = (
    <>
      <div className="flex justify-between gap-1">
        <p>
          <span className="font-bold">{user.postCount}</span> posts
        </p>
        <Link to={`/user/${id}/followers`} className="hover:underline">
          <span className="font-bold">{user.followers}</span> followers
        </Link>
        <Link to={`/user/${id}/following`} className="hover:underline">
          <span className="font-bold">{user.following}</span> following
        </Link>
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
