import { Loader2 } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { Link } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCreatePostMutation } from "./postsApiSlice";

const MAX_LENGTH = 512;

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
  onPostCreated?: (text: string, parentId?: string) => void;
}

const CreatePost: FC<Props> = ({ onPostCreated }) => {
  const { isAuth, isLoading, user } = useAuth();

  const [value, setValue] = useState("");
  const [createPost, { isLoading: isCreating, isError }] = useCreatePostMutation();

  const handleSubmit = async () => {
    const v = value.trim();
    if (v.length === 0 || v.length > MAX_LENGTH) return;

    await createPost({ text: v }).unwrap();
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

  if (!isAuth) {
    return (
      <div className="rounded border p-4">
        <Link to={"/login"} className="link">
          Login
        </Link>{" "}
        or{" "}
        <Link to={"/register"} className="link">
          Sign up
        </Link>{" "}
        to make a post.
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Avatar>
        <AvatarFallback>{user.username[0]}</AvatarFallback>
      </Avatar>
      <div className="w-full">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={
            "Your opinion on " +
            placeholders[Math.floor(Math.random() * placeholders.length)]
          }
          maxLength={MAX_LENGTH}
          className={`scrollbar resize-none ${
            isError ? "border-destructive focus-visible:ring-destructive" : ""
          }`}
          onInput={(e) => {
            e.currentTarget.style.height = "";
            e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
          }}
        />
        <div className="mt-2 flex justify-between gap-1">
          <div className="flex gap-1 divide-x">
            {value.length !== 0 && (
              <p className="text-xs text-muted-foreground">
                {value.length}/{MAX_LENGTH}
              </p>
            )}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={
              isCreating || value.trim().length === 0 || value.length > MAX_LENGTH
            }
          >
            Post
          </Button>
        </div>
      </div>
    </div>
  );
};
export default CreatePost;
