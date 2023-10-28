import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useRef, useState } from "react";
import { UploadCtxProvider } from "@uploadcare/blocks";
import { UploadEventDetails } from "@/lib/HeadlessModal";
import { useAuth } from "../auth/useAuth";
import { User } from "../auth/authSlice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  nameMaxLength,
  optimizeImageUrl,
  usernameMaxLength,
  validatePassword,
} from "@/lib/utils";
import { useChangeUserMutation, useGetUserQuery } from "./userApiSlice";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import CustomInput from "@/components/CustomInput";
import { useDebounce } from "@/lib/hooks";
import { useCheckUsernameMutation } from "../auth/authApiSlice";
import SubmitButton from "@/components/SubmitButton";
import ConfirmPassword from "@/components/ConfirmPassword";
import PasswordInput from "@/components/PasswordInput";

interface ItemProps {
  header: string;
  subitems: string[];
}

const MenuItem = ({ header, subitems }: ItemProps) => {
  return (
    <div className="pb-4">
      <li className="mb-1">
        <a
          href={"#" + header.toLowerCase()}
          className="group flex rounded-lg px-2 py-1 hover:bg-secondary"
        >
          <h3 className="ml-3 font-semibold">{header}</h3>
        </a>
      </li>
      <div className="text-muted-foreground">
        {subitems.map((i) => (
          <li key={i} className="mb-1">
            <a
              href={"#" + i.replace(" ", "_").toLowerCase()}
              className="group flex items-center rounded-lg px-2 py-1 hover:bg-secondary"
            >
              <span className="ml-3">{i}</span>
            </a>
          </li>
        ))}
      </div>
    </div>
  );
};

const MENU: ItemProps[] = [
  { header: "Profile", subitems: ["Profile picture", "Bio", "Name"] },
  { header: "Security", subitems: ["Password"] },
];

const ProfilePictureSection = ({ user }: { user: User }) => {
  const uploaderRef = useRef<UploadCtxProvider>(null);
  const [changeUser] = useChangeUserMutation();

  const handleDelete = () => {
    changeUser({ avatar: { url: "", type: "" } });
  };

  const handleAvatarChange = useCallback(
    (e: CustomEvent<UploadEventDetails>) => {
      const { detail } = e;
      if (detail.ctx !== "avatar-uploader") return;
      changeUser({
        avatar: {
          url: detail.data[0].cdnUrl ?? "",
          type: detail.data[0].contentInfo.mime.subtype,
        },
      });
      uploaderRef.current?.addFileFromObject;
    },
    [changeUser]
  );

  const onDoneFlow = () => uploaderRef.current?.uploadCollection.clearAll();

  useEffect(() => {
    window.addEventListener("LR_DATA_OUTPUT", handleAvatarChange);
    window.addEventListener("LR_DONE_FLOW", onDoneFlow);
    return () => {
      window.removeEventListener("LR_DATA_OUTPUT", handleAvatarChange);
      window.removeEventListener("LR_DONE_FLOW", onDoneFlow);
    };
  }, [handleAvatarChange]);

  return (
    <section>
      <p id="profile_picture" className="scroll-m-20 pb-4 text-lg text-muted-foreground">
        Profile picture
      </p>
      <div>
        <Avatar className="h-40 w-40 text-4xl">
          {user.avatar && (
            <AvatarImage
              src={optimizeImageUrl(user.avatar.url, user.avatar.type, {
                scale: "160x160",
                quality: "smart",
              })}
            />
          )}
          <AvatarFallback>{user.username[0]}</AvatarFallback>
        </Avatar>
        <div className="mt-8 flex gap-2">
          <Button onClick={() => uploaderRef.current?.initFlow()}>
            {user.avatar?.url ? "Change Picture" : "Add Picture"}
          </Button>
          {user.avatar?.url && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="secondary">Remove Picture</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This action will delete your profile
                    picture
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
      <lr-upload-ctx-provider
        ctx-name="avatar-uploader"
        ref={uploaderRef}
      ></lr-upload-ctx-provider>
      <lr-data-output ctx-name="post-uploader" use-event></lr-data-output>
    </section>
  );
};

const BioSection = ({ bio }: { bio: string | null }) => {
  const MAX_LENGTH = 128;
  const [changeUser, { isLoading }] = useChangeUserMutation();
  const [value, setValue] = useState(bio ?? "");

  const onSubmit = () => {
    changeUser({ bio: value.trim() });
  };

  return (
    <section>
      <p id="bio" className="scroll-m-20 pb-2 text-lg text-muted-foreground">
        Bio
      </p>

      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add bio..."
        className="resize-none"
        maxLength={MAX_LENGTH}
        name="bio"
      />
      <div className="flex justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          {value.length !== 0 && `${value.length}/${MAX_LENGTH}`}
        </p>
        <SubmitButton
          onClick={onSubmit}
          disabled={value.length > MAX_LENGTH}
          isLoading={isLoading}
        >
          {bio ? (value ? "Change Bio" : "Remove Bio") : "Add Bio"}
        </SubmitButton>
      </div>
    </section>
  );
};

const NameSection = ({ user }: { user: User }) => {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const debouncedUsername = useDebounce(username, 350);

  const [changeUser, { isLoading }] = useChangeUserMutation();
  const [checkUsername, { isError: isUsernameTaken, isLoading: isCheckLoading }] =
    useCheckUsernameMutation();

  useEffect(() => {
    if (debouncedUsername.trim().length) {
      checkUsername(debouncedUsername.trim());
    }
  }, [checkUsername, debouncedUsername]);

  const disabled =
    !name.trim().length ||
    !username.trim().length ||
    (name.trim() === user.name && username.trim() === user.username) ||
    isCheckLoading ||
    isUsernameTaken ||
    isLoading;

  const onSubmit = () => {
    if (disabled) return;
    changeUser({ username: username.trim(), name: name.trim() });
  };

  return (
    <section>
      <p id="name" className="scroll-m-20 pb-4 text-lg text-muted-foreground">
        Name
      </p>
      <div className="space-y-4">
        <CustomInput
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          label="Name"
          placeholder="John Biden"
          maxLength={nameMaxLength}
          autoComplete="name"
        />
        <CustomInput
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          label="Username"
          description={isUsernameTaken ? "This username is already taken!" : undefined}
          placeholder="j_biden"
          isError={isUsernameTaken}
          isLoading={isCheckLoading}
          maxLength={usernameMaxLength}
          autoComplete="username"
        />
        <SubmitButton onClick={onSubmit} disabled={disabled} isLoading={isLoading}>
          Change
        </SubmitButton>
      </div>
    </section>
  );
};

const PasswordSection = () => {
  const [changeUser, { isLoading }] = useChangeUserMutation();

  const [password, setPassword] = useState("");
  const [isValid, setIsValid] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const isOldValid = validatePassword(oldPassword.trim());

  const disabled = !isValid || !isOldValid || isLoading;
  const [isError, setIsError] = useState(false);

  const onSubmit = async () => {
    try {
      await changeUser({ password, confirmPassword: oldPassword }).unwrap();
      setPassword("");
      setIsValid(false);
      setOldPassword("");
    } catch {
      setIsError(true);
    }
  };

  return (
    <section>
      <p id="password" className="scroll-m-20 pb-4 text-lg text-muted-foreground">
        Change Password
      </p>
      <div className="space-y-4">
        <PasswordInput
          label="Old password"
          value={oldPassword}
          onChange={(e) => {
            setOldPassword(e.currentTarget.value);
            setIsError(false);
          }}
          description={isError ? "Wrong password" : "At least 4 characters"}
          isError={isError || (oldPassword.trim().length > 0 && !isOldValid)}
          placeholder="cool_password_2023"
        />
        <ConfirmPassword
          description="At least 4 characters"
          validate={validatePassword}
          onChange={(value, isValid) => {
            setPassword(value);
            setIsValid(isValid);
          }}
          placeholder="cool_password_2023"
        />
        <SubmitButton onClick={onSubmit} disabled={disabled} isLoading={isLoading}>
          Change
        </SubmitButton>
      </div>
    </section>
  );
};

const SettingsPage = () => {
  const { user } = useAuth();
  const { data } = useGetUserQuery(user?.id ?? "", { skip: !user?.id });

  if (!user || !data) {
    return <></>;
  }

  return (
    <div className="relative scroll-smooth sm:container">
      <aside
        className="fixed top-14 z-30 h-full w-40 -translate-x-full transition-transform sm:translate-x-0 md:w-64"
        aria-label="Sidebar"
      >
        <div className="h-full overflow-y-auto bg-card px-3 py-4">
          <ul className="text-sm">
            {MENU.map((m) => (
              <MenuItem key={m.header} header={m.header} subitems={m.subitems} />
            ))}
          </ul>
        </div>
      </aside>
      <main className="p-4 sm:ml-40 md:ml-64">
        <h2 id="profile" className="my-2 scroll-m-20 text-4xl font-bold tracking-tight">
          Profile settings
        </h2>
        <div className="space-y-8">
          <ProfilePictureSection user={user} />
          <BioSection bio={data.bio} />
          <NameSection user={user} />
        </div>
        <h2
          id="security"
          className="mb-2 mt-8 scroll-m-20 text-4xl font-bold tracking-tight"
        >
          Security
        </h2>
        <div className="space-y-8">
          <PasswordSection />
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
