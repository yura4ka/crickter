import { useAuth } from "@/features/auth/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Github, LogOut, Settings, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import ModeToggle from "./ui/ModeToggle";
import { useLogoutMutation } from "@/features/auth/authApiSlice";

const Navbar = () => {
  const { isAuth, isLoading, user } = useAuth();
  const [logout] = useLogoutMutation();

  return (
    <header className="supports-backdrop-blur:bg-background/60 sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-2 sm:container">
        <Link to="/" className="font-mono text-2xl font-semibold tracking-tighter">
          crickter
        </Link>
        <nav className="flex">
          {!isLoading &&
            (isAuth ? (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Avatar className="mr-2 sm:mx-4">
                    {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                    <AvatarFallback>{user.username[0]}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-44">
                  <DropdownMenuLabel>
                    <p className="text-base">{user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link to={`/user/${user.id}`}>
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link to={`/user/${user.id}`}>
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button asChild className="hidden sm:flex">
                  <Link to="/register">Sign up</Link>
                </Button>
                <Button variant="outline" asChild className="mr-1 sm:mx-2">
                  <Link to="/login" className="whitespace-nowrap">
                    Log in
                  </Link>
                </Button>
              </>
            ))}
          <Button variant="ghost" size="icon" asChild>
            <a href="https://github.com/yura4ka/crickter" target="_blank">
              <Github />
            </a>
          </Button>
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
