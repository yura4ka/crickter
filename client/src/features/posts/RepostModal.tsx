import CreatePost from "./CreatePost";
import { Post } from "./postsApiSlice";
import { DialogHeader, Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface Props {
  post: Post | null;
  isOpen: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}
const RepostModal = ({ post, isOpen, setOpen }: Props) => {
  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Make a repost</DialogTitle>
        </DialogHeader>
        {post && (
          <CreatePost
            repostOf={post}
            originalId={post.id}
            onPostCreated={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
export default RepostModal;
