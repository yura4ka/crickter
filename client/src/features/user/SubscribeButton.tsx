import { FC } from "react";
import { useFollowMutation, useUnfollowMutation } from "./userApiSlice";
import { Button } from "@/components/ui/button";
import { useLoginModal } from "../loginModal/useLoginModal";
import { useAuth } from "../auth/useAuth";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size: "sm" | "lg";
  isSubscribed: boolean;
  userId: string;
  onSuccess?: (follow: boolean) => void;
}

const SubscribeButton: FC<ButtonProps> = ({
  isSubscribed,
  size,
  userId,
  onSuccess: onAction,
  ...rest
}) => {
  const { isAuth } = useAuth();
  const { showModal } = useLoginModal();
  const [follow] = useFollowMutation();
  const [unfollow] = useUnfollowMutation();

  const handleClick = async () => {
    if (!isAuth) {
      showModal();
      return;
    }
    if (isSubscribed) await unfollow(userId).unwrap();
    else await follow(userId).unwrap();
    onAction?.(!isSubscribed);
  };

  return isSubscribed ? (
    <Button onClick={handleClick} size={size} variant="secondary" {...rest}>
      Following
    </Button>
  ) : (
    <Button onClick={handleClick} size={size} {...rest}>
      Follow
    </Button>
  );
};

export default SubscribeButton;
