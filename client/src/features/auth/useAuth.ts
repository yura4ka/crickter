import { useAppSelector } from "@/app/hooks";
import { AuthState, User, selectAuth } from "./authSlice";
import { useRefreshQuery } from "./authApiSlice";

type AuthReturnType =
  | (Required<Omit<AuthState, "user">> & {
      user: User;
      isAuth: true;
      isLoading: boolean;
    })
  | (AuthState & {
      isAuth: false;
      isLoading: boolean;
    });

export const useAuth = () => {
  const auth = useAppSelector(selectAuth);
  const isAuth = !!auth.user;
  const { isFetching } = useRefreshQuery(undefined, {
    skip: isAuth || auth.user === null,
  });
  return { ...auth, isAuth, isLoading: isFetching } as AuthReturnType;
};
