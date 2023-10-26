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

interface Props {
  children: React.ReactElement;
  isOwner: boolean;
  post: NormalPost;
  handleEditing: (isEditing: boolean) => void;
}

const PostContextMenu = ({ children, isOwner, post, handleEditing }: Props) => {
  const [changePost] = useChangePostMutation();
  const [deletePost] = useDeletePostMutation();

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
          {isOwner ? (
            <>
              <DropdownMenuItem>
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
            <DropdownMenuItem>
              <DropdownMenuItem>
                <UserX className="mr-2 h-4 w-4" />
                <span>Block User</span>
              </DropdownMenuItem>
            </DropdownMenuItem>
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
