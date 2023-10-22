import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { Post } from "./postsApiSlice";

interface ModalState {
  isOpen: boolean;
  post: Post | null;
}

const initialState: ModalState = {
  isOpen: false,
  post: null,
};

const repostModalSlice = createSlice({
  name: "repostModal",
  initialState,
  reducers: {
    show: (state, action: PayloadAction<Post>) => {
      state.isOpen = true;
      state.post = action.payload;
    },
    hide: (state) => {
      state.isOpen = false;
    },
    setOpen: (state, action: PayloadAction<{ open: boolean; post: Post }>) => {
      state.isOpen = action.payload.open;
      state.post = action.payload.post;
    },
  },
});

export const { show, hide, setOpen } = repostModalSlice.actions;
export default repostModalSlice.reducer;
