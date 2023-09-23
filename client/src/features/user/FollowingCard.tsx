import {
  followersAdapter,
  followersSelector,
  useGetFollowingQuery,
  userApi,
} from "./userApiSlice";
import { FC, useRef, useState } from "react";
import { useInfiniteScroll } from "@/lib/hooks";
import UserCard from "./UserCard";
import { Loader2 } from "lucide-react";
import { useAppDispatch } from "@/app/hooks";

interface Props {
  userId: string;
  authId: string | undefined;
  setModal: (open: boolean) => void;
}

const FollowingCard: FC<Props> = ({ userId, authId, setModal }) => {
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(1);
  const { users, hasMore, isFetching } = useGetFollowingQuery(
    { page, id: userId },
    {
      selectFromResult: ({ data, ...other }) => ({
        users: followersSelector.selectAll(
          data?.users ?? followersAdapter.getInitialState()
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

  const handleSubscribe = (id: string, follow: boolean) => {
    dispatch(
      userApi.util.updateQueryData("getFollowing", { page: 0, id: userId }, (draft) => {
        followersAdapter.updateOne(draft.users, {
          id,
          changes: { isSubscribed: follow },
        });
      })
    );
  };

  return (
    <main className="flex flex-col gap-4">
      {users.map((u) => (
        <UserCard
          key={u.id}
          user={u}
          hidden={u.id === authId}
          handleSubscribe={handleSubscribe}
          onLinkClick={() => setModal(false)}
        />
      ))}
      {isFetching && (
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
    </main>
  );
};

export default FollowingCard;
