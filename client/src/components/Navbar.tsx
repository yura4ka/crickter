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
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import ModeToggle from "./ui/ModeToggle";
import { useLogoutMutation } from "@/features/auth/authApiSlice";

const Navbar = () => {
  const { isAuth, isLoading, user } = useAuth();
  const [logout] = useLogoutMutation();

  return (
    <header className="supports-backdrop-blur:bg-background/60 sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex items-center justify-between gap-4 py-2">
        <h1 className="font-mono text-2xl font-semibold tracking-tighter">crickter</h1>
        <nav className="flex gap-2">
          {!isLoading &&
            (isAuth ? (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Avatar>
                    <AvatarFallback>{user.username[0]}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-44">
                  <DropdownMenuLabel>
                    <p className="text-base">{user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link to="/profile">
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link to="/profile">
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
              <Button variant="outline" asChild className="mr-4">
                <Link to="/login">Log in</Link>
              </Button>
            ))}
          <Button variant="ghost" size="icon" asChild>
            <a href="https://github.com/yura4ka/">
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
