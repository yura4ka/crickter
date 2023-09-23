import {
  DialogHeader,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useLoginModal } from "./useLoginModal";
import Login from "../auth/Login";

const LoginModal = () => {
  const { isOpen, setOpen } = useLoginModal();

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="p-0 sm:max-w-[500px]">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>You are not signed in</DialogTitle>
          <DialogDescription>Login or Sign up to perform this action</DialogDescription>
        </DialogHeader>
        <Login
          redirect={false}
          className="mt-0 border-0 p-0 sm:border-0 [&>div]:pt-0 [&>div]:sm:pt-2"
          outerClass="sm:place-content-stretch sm:p-0"
        />
      </DialogContent>
    </Dialog>
  );
};
export default LoginModal;
