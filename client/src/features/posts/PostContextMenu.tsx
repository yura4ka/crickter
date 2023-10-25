import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, Trash2, History, UserX } from "lucide-react";

interface Props {
  children: React.ReactElement;
  isOwner: boolean;
  canComment: boolean;
}

const PostContextMenu = ({ children, isOwner, canComment }: Props) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {isOwner ? (
          <>
            <DropdownMenuItem>
              <History className="mr-2 h-4 w-4" />
              <span>View history</span>
            </DropdownMenuItem>
            <DropdownMenuCheckboxItem>Allow Comments</DropdownMenuCheckboxItem>
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              <span>Edit Post</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete Post</span>
            </DropdownMenuItem>
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
  );
};

export default PostContextMenu;
