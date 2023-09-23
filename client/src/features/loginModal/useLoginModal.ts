import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { show, hide, setOpen } from "./loginModalSlice";

export const useLoginModal = () => {
  const { isOpen } = useAppSelector((state) => state.loginModal);
  const dispatch = useAppDispatch();

  const showModal = () => dispatch(show());
  const hideModal = () => dispatch(hide());
  const setModalOpen = (isOpen: boolean) => dispatch(setOpen(isOpen));

  return { isOpen, showModal, hideModal, setOpen: setModalOpen };
};
