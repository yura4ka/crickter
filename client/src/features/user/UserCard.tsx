import { FC } from "react";
import { BaseUser } from "./userApiSlice";
import SubscribeButton from "./SubscribeButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { optimizeImageUrl } from "@/lib/utils";

interface Props {
  user: BaseUser;
  hidden: boolean;
  handleSubscribe?: (id: string, follow: boolean) => void;
  onLinkClick?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}

const UserCard: FC<Props> = ({ user, hidden, handleSubscribe, onLinkClick }) => {
  return (
    <section className="flex items-center justify-between gap-1">
      <Link
        to={`/user/${user.id}`}
        onClick={onLinkClick}
        className="group flex flex-1 items-center gap-4"
      >
        <Avatar>
          {user.avatar && (
            <AvatarImage src={optimizeImageUrl(user.avatar.url, user.avatar.type)} />
          )}
          <AvatarFallback>{user.username[0]}</AvatarFallback>
        </Avatar>
        <div>
          <p className="break-all font-bold group-hover:underline">{user.name}</p>
          <p className="break-all group-hover:underline">@{user.username}</p>
        </div>
      </Link>
      <SubscribeButton
        isSubscribed={user.isSubscribed}
        size="sm"
        userId={user.id}
        className={hidden ? "hidden" : ""}
        onSuccess={(follow) => handleSubscribe?.(user.id, follow)}
      />
    </section>
  );
};

export default UserCard;
