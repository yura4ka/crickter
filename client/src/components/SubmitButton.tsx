import { FC } from "react";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
}

const SubmitButton: FC<Props> = ({ isLoading, children, ...rest }: Props) => {
  return (
    <Button {...rest} disabled={rest.disabled || isLoading}>
      <Loader2
        className={`h-4 w-4 animate-spin transition-opacity ${
          isLoading ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`transition-transform ${
          isLoading ? "translate-x-2" : "-translate-x-2"
        }`}
      >
        {children}
      </div>
    </Button>
  );
};
export default SubmitButton;
