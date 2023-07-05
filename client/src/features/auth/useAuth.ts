import { useAppSelector } from "@/app/hooks";
import { selectUser } from "./authSlice";
import { useRefreshQuery } from "./authApiSlice";

export const useAuth = () => {
  const user = useAppSelector(selectUser);
  const isAuth = !!user;
  const { isFetching } = useRefreshQuery(undefined, {
    skip: isAuth || user === null,
  });
  return { user, isAuth, isLoading: isFetching };
};
