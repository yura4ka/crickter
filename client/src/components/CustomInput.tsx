import { FC, useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  isError?: boolean;
  isLoading?: boolean;
}

const CustomInput: FC<CustomInputProps> = ({
  label,
  description,
  isError,
  isLoading,
  ...rest
}) => {
  const createdId = useId();
  const id = rest.id || label || "input-" + createdId;

  return (
    <div className="flex flex-col space-y-1.5">
      <Label
        htmlFor={id}
        className={cn("flex items-center gap-1.5", isError && "text-error")}
      >
        {label}
        <Loader2
          className={`h-[0.875rem] w-[0.875rem] animate-spin transition-opacity ${
            isLoading !== true ? "opacity-0" : "opacity-100"
          }`}
        />
      </Label>
      <Input
        {...rest}
        id={id}
        className={cn(
          rest.className,
          isError && "border-destructive focus-visible:ring-destructive"
        )}
      />
      <p className={`text-sm ${isError ? "text-error" : "text-muted-foreground"}`}>
        {description}
      </p>
    </div>
  );
};
export default CustomInput;
