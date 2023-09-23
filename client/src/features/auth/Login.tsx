import CustomInput from "@/components/CustomInput";
import PasswordInput from "@/components/PasswordInput";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FC, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLoginMutation } from "./authApiSlice";
import { cn, emailRegexp, validatePassword } from "@/lib/utils";
import SubmitButton from "@/components/SubmitButton";
import { useLoginModal } from "../loginModal/useLoginModal";

interface Props {
  className?: string;
  outerClass?: string;
  redirect?: boolean;
}

const Login: FC<Props> = ({ className, outerClass, redirect = true }) => {
  const navigate = useNavigate();
  const { hideModal } = useLoginModal();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isError, setIsError] = useState(false);

  const [login, { isLoading }] = useLoginMutation();

  const onEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setIsError(false);
  };

  const onPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setIsError(false);
  };

  const canSubmit =
    !isError && emailRegexp.test(email.trim()) && validatePassword(password);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email: email.trim(), password: password.trim() }).unwrap();
      if (redirect) navigate("/");
      hideModal();
    } catch {
      setIsError(true);
    }
  };

  return (
    <div className={cn("grid p-4 sm:place-content-center sm:p-2", outerClass)}>
      <Card
        className={cn("mt-8 h-min p-4 sm:mt-0 sm:min-w-[420px] sm:border", className)}
      >
        <CardHeader className="px-0 sm:p-6">
          <CardTitle>Log in</CardTitle>
          <CardDescription>
            Don't have an account?{" "}
            <Link
              to={"/register"}
              onClick={hideModal}
              className="font-semibold text-cyan-600 transition-all hover:text-cyan-700 hover:underline dark:text-cyan-700 dark:hover:text-cyan-800"
            >
              Sign up
            </Link>
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="grid items-center gap-4 px-0 sm:p-6 sm:pt-0">
            <CustomInput
              type="text"
              label="Email"
              value={email}
              onChange={onEmailChange}
              isError={isError}
              description={isError ? "Wrong email or password" : undefined}
            />
            <PasswordInput
              label="Password"
              value={password}
              onChange={onPasswordChange}
              isError={isError}
              description={isError ? "Wrong email or password" : undefined}
            />
          </CardContent>
          <CardFooter className="px-0 sm:p-6 sm:pt-0">
            <SubmitButton isLoading={isLoading} disabled={!canSubmit} className="w-full">
              Log in
            </SubmitButton>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
