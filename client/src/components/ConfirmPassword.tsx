import { FC, useState } from "react";
import PasswordInput from "./PasswordInput";

interface Props
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  description: string;
  onChange: (value: string, isValid: boolean) => void;
  validate: (value: string) => boolean;
}

const PasswordInfo = {
  CONFIRM: "Confirm password",
  NOT_MATCH: "Passwords do not match",
} as const;

const initializePassword = (info: string = PasswordInfo.CONFIRM) => ({
  value: "",
  isError: false,
  info: info,
});

const ConfirmPassword: FC<Props> = ({ description, onChange, validate, ...rest }) => {
  const [password, setPassword] = useState(() => initializePassword(description));
  const [confirm, setConfirm] = useState(() => initializePassword());

  const onPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const value2 = confirm.value.trim();
    const isValid = validate(value.trim());
    const isEqual = value2 === value.trim();

    setPassword({ value, isError: !isValid, info: description });

    if (!isEqual) {
      setConfirm((prev) => ({
        ...prev,
        isError: value2.length !== 0,
        info: value2.length === 0 ? PasswordInfo.CONFIRM : PasswordInfo.NOT_MATCH,
      }));
    }

    onChange(value, isValid && isEqual);
  };

  const onConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const original = password.value.trim();

    if (value.trim().length === 0) {
      setConfirm({ value, isError: false, info: PasswordInfo.CONFIRM });
      onChange(password.value, false);
      return;
    }

    const isEqual = value.trim() === original;
    setConfirm({ value, isError: !isEqual, info: PasswordInfo.NOT_MATCH });

    const isValid = isEqual && validate(original);
    setPassword((prev) => ({ ...prev, isError: !isValid }));

    onChange(original, isValid);
  };

  return (
    <>
      <PasswordInput
        label="Password"
        value={password.value}
        onChange={onPasswordChange}
        description={password.info}
        isError={password.isError}
        {...rest}
      />
      <PasswordInput
        label="Confirm password"
        value={confirm.value}
        onChange={onConfirmChange}
        description={confirm.info}
        isError={confirm.isError}
        {...rest}
      />
    </>
  );
};
export default ConfirmPassword;
