import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, Trash2, History, UserX } from "lucide-react";
import {
  NormalPost,
  useChangePostMutation,
  useDeletePostMutation,
} from "./postsApiSlice";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import {
  useBlockUserMutation,
  useIsBlockedQuery,
  useUnblockUserMutation,
} from "../user/userApiSlice";

const BlockUserSection = ({ userId }: { userId: string }) => {
  const [block] = useBlockUserMutation();
  const [unblock] = useUnblockUserMutation();
  const { data: isBlocked, isLoading } = useIsBlockedQuery({ userId, meBlocked: false });

  if (isLoading || isBlocked === undefined) return <></>;

  const handleClick = () => {
    if (isBlocked) unblock(userId);
    else block(userId);
  };

  return (
    <DropdownMenuItem onClick={handleClick}>
      <UserX className="mr-2 h-4 w-4" />
      <span>{!isBlocked ? "Block User" : "Unblock User"}</span>
    </DropdownMenuItem>
  );
};

interface Props {
  children: React.ReactElement;
  userId?: string;
  post: NormalPost;
  handleEditing: (isEditing: boolean) => void;
}

const PostContextMenu = ({ children, userId, post, handleEditing }: Props) => {
  const [changePost] = useChangePostMutation();
  const [deletePost] = useDeletePostMutation();
  const navigate = useNavigate();

  const handleCanCommentChange = (canComment: boolean) => {
    changePost({ post, changes: { canComment } });
  };

  const handleDelete = () => {
    deletePost(post);
  };

  return (
    <AlertDialog>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          {userId === post.user.id ? (
            <>
              <DropdownMenuItem onClick={() => navigate(`/post/${post.id}/history`)}>
                <History className="mr-2 h-4 w-4" />
                <span>View history</span>
              </DropdownMenuItem>
              <DropdownMenuCheckboxItem
                checked={post.canComment}
                onCheckedChange={handleCanCommentChange}
              >
                Allow Comments
              </DropdownMenuCheckboxItem>
              <DropdownMenuItem onClick={() => handleEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                <span>Edit Post</span>
              </DropdownMenuItem>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete Post</span>
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </>
          ) : (
            post.user.id && <BlockUserSection userId={post.user.id} />
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This action will delete this post
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PostContextMenu;
