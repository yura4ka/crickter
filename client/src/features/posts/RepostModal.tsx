import CreatePost from "./CreatePost";
import { DialogHeader, Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useRepostModal } from "./useRepostModal";

const RepostModal = () => {
  const { isOpen, post, setOpen, hideModal } = useRepostModal();

  if (!post) return <></>;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => setOpen(open, post)}>
      <DialogContent className="scrollbar max-h-screen max-w-sm overflow-y-scroll sm:my-2 sm:max-w-xl md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Make a repost</DialogTitle>
        </DialogHeader>
        <CreatePost repostOf={post} originalId={post.id} onPostCreated={hideModal} />
      </DialogContent>
    </Dialog>
  );
};
export default RepostModal;
