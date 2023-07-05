import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";

const AuthLayout = () => {
  const { isAuth, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading</div>;
  }

  if (!isAuth) {
    return <Navigate to={"/login"} replace={true} />;
  }

  return (
    <>
      <Outlet />
    </>
  );
};

export default AuthLayout;
