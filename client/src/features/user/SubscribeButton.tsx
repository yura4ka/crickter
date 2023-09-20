import { FC } from "react";
import { useFollowMutation, useUnfollowMutation } from "./userApiSlice";
import { Button } from "@/components/ui/button";

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
  const [follow] = useFollowMutation();
  const [unfollow] = useUnfollowMutation();

  const handleClick = async () => {
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
