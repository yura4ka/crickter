import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { show, hide, setOpen } from "./repostModalSlice";
import { Post } from "./postsApiSlice";

export const useRepostModal = () => {
  const { isOpen, post } = useAppSelector((state) => state.repostModal);
  const dispatch = useAppDispatch();

  const showModal = (post: Post) => dispatch(show(post));
  const hideModal = () => dispatch(hide());
  const setModalOpen = (open: boolean, post: Post) => dispatch(setOpen({ open, post }));

  return { isOpen, post, showModal, hideModal, setOpen: setModalOpen };
};
