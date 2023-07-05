import { useAppSelector } from "@/app/hooks";
import { User, selectUser } from "./authSlice";
import { useRefreshQuery } from "./authApiSlice";

type AuthReturnType =
  | {
      isAuth: true;
      user: User;
      isLoading: boolean;
    }
  | {
      isAuth: false;
      user?: User | null;
      isLoading: boolean;
    };

export const useAuth = () => {
  const user = useAppSelector(selectUser);
  const isAuth = !!user;
  const { isFetching } = useRefreshQuery(undefined, {
    skip: isAuth || user === null,
  });
  return { user, isAuth, isLoading: isFetching } as AuthReturnType;
};
