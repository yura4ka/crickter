import CustomInput from "@/components/CustomInput";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDebounce } from "@/lib/hooks";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useCheckEmailMutation,
  useLoginMutation,
  useRegisterMutation,
} from "./authApiSlice";
import { emailRegexp, validatePassword } from "@/lib/utils";
import ConfirmPassword from "@/components/ConfirmPassword";
import { Button } from "@/components/ui/button";

const EmailInfoState = {
  OK: "",
  WRONG_FORMAT: "Wrong email format",
  TAKEN: "This email is already in use",
} as const;

type TEmailInfo = (typeof EmailInfoState)[keyof typeof EmailInfoState];

const initializeForm = () => ({
  email: "",
  username: "",
  password: "",
  isPasswordValid: false,
});

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState(() => initializeForm());

  const changeForm = <T extends keyof typeof form>(key: T, value: (typeof form)[T]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const [emailInfo, setEmailInfo] = useState<TEmailInfo>(EmailInfoState.OK);

  const [checkEmail, { isError: isEmailTaken, isLoading: isCheckLoading }] =
    useCheckEmailMutation();

  const [register, { isLoading: isRegisterLoad }] = useRegisterMutation();
  const [login, { isLoading: isLoginLoad }] = useLoginMutation();

  const debouncedEmail = useDebounce(form.email, 350);
  useEffect(() => {
    if (debouncedEmail.trim().length && emailRegexp.test(debouncedEmail.trim())) {
      checkEmail(debouncedEmail.trim());
    }
  }, [checkEmail, debouncedEmail]);

  const onEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    changeForm("email", value);

    setEmailInfo(
      emailRegexp.test(value.trim()) ? EmailInfoState.OK : EmailInfoState.WRONG_FORMAT
    );
  };

  const canSubmit =
    !isCheckLoading &&
    !isRegisterLoad &&
    !isLoginLoad &&
    !isEmailTaken &&
    emailInfo === EmailInfoState.OK &&
    form.username.trim().length !== 0 &&
    form.isPasswordValid;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({
        email: form.email.trim(),
        password: form.password.trim(),
        username: form.username.trim(),
      }).unwrap();
      await login({ email: form.email.trim(), password: form.password.trim() }).unwrap();
    } catch {
      navigate("/");
    } finally {
      navigate("/profile");
    }
  };

  return (
    <div className="grid h-full place-content-center p-2">
      <Card className="min-w-[420px]">
        <CardHeader>
          <CardTitle>Sign up</CardTitle>
          <CardDescription>
            Already have an account?{" "}
            <Link
              to={"/login"}
              className="font-semibold text-cyan-600 transition-all hover:text-cyan-700 hover:underline dark:text-cyan-700 dark:hover:text-cyan-800"
            >
              Log in
            </Link>
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="grid items-center gap-4">
            <CustomInput
              type="text"
              value={form.email}
              onChange={onEmailChange}
              label="Email"
              isError={isEmailTaken || emailInfo !== EmailInfoState.OK}
              isLoading={isCheckLoading}
              description={isEmailTaken ? EmailInfoState.TAKEN : emailInfo}
              placeholder="john_biden@gmail.com"
            />
            <CustomInput
              type="text"
              value={form.username}
              onChange={(e) => changeForm("username", e.target.value)}
              label="Username"
              description="Create username (you can change it later)"
              placeholder="j_biden"
            />
            <ConfirmPassword
              description="At least 4 characters"
              validate={validatePassword}
              onChange={(value, isValid) => {
                changeForm("password", value);
                changeForm("isPasswordValid", isValid);
              }}
              placeholder="cool_password_2023"
            />
          </CardContent>
          <CardFooter>
            <Button disabled={!canSubmit} className="w-full">
              Sign up
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Register;
