import CustomInput from "@/components/CustomInput";
import PasswordInput from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLoginMutation } from "./authApiSlice";
import { emailRegexp, validatePassword } from "@/lib/utils";

const Login = () => {
  const navigate = useNavigate();

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
    !isError &&
    !isLoading &&
    emailRegexp.test(email.trim()) &&
    validatePassword(password);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email: email.trim(), password: password.trim() }).unwrap();
      navigate("/");
    } catch {
      setIsError(true);
    }
  };

  return (
    <div className="grid h-full place-content-center p-2">
      <Card className="min-w-[420px]">
        <CardHeader>
          <CardTitle>Log in</CardTitle>
          <CardDescription>
            Don't have an account?{" "}
            <Link
              to={"/register"}
              className="font-semibold text-cyan-600 transition-all hover:text-cyan-700 hover:underline dark:text-cyan-700 dark:hover:text-cyan-800"
            >
              Sign up
            </Link>
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="grid items-center gap-4">
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
          <CardFooter>
            <Button disabled={!canSubmit} className="w-full">
              Log in
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
