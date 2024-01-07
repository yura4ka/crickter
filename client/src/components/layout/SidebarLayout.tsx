import { useGetPopularTagsQuery } from "@/features/tags/tagsApiSlice";
import { Search } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { useEffect, useRef } from "react";
import { Link, Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";

const Trends = () => {
  const { data: tags, isLoading } = useGetPopularTagsQuery();

  return (
    <div className="rounded-md bg-accent text-accent-foreground">
      <h3 className="border-b border-accent-border p-2 text-xl font-bold">Trending</h3>
      <div className="divide-y divide-accent-border">
        {isLoading || !tags ? (
          <>
            <div className="p-2">
              <Skeleton className="mb-1.5 h-[18px] w-[160px] bg-accent-border" />
              <Skeleton className="h-[14px] w-[60px] bg-accent-border" />
            </div>
            <div className="p-2">
              <Skeleton className="mb-1.5 h-[18px] w-[160px] bg-accent-border" />
              <Skeleton className="h-[14px] w-[60px] bg-accent-border" />
            </div>
            <div className="p-2">
              <Skeleton className="mb-1.5 h-[18px] w-[160px] bg-accent-border" />
              <Skeleton className="h-[14px] w-[60px] bg-accent-border" />
            </div>
          </>
        ) : (
          tags.map((t) => (
            <Link
              to={`tags/${t.name}`}
              key={t.name}
              className="block p-2 transition-colors hover:bg-accent-border"
            >
              <p className="text-lg font-bold">#{t.name}</p>
              <p className="text-sm text-muted-foreground">{t.postCount} tweets</p>
            </Link>
          ))
        )}
        {tags && tags.length === 0 && (
          <p className="px-2 py-4 text-lg">Nothing here...</p>
        )}
      </div>
      {tags && tags.length !== 0 && (
        <Link to="tags" className="link block border-t border-accent-border p-2">
          Show more
        </Link>
      )}
    </div>
  );
};

const PostSearch = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (inputRef.current) inputRef.current.value = params.get("q") ?? "";
  }, [params]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = inputRef.current?.value.trim();
    if (value) navigate(`post/search?q=${value}`);
  };

  return (
    <form onSubmit={onSubmit} className="relative">
      <Input
        name="search"
        placeholder="Search"
        className="bg-muted pl-9"
        ref={inputRef}
      />
      <Search className="absolute left-2 top-1/2 h-5 w-5 -translate-y-1/2" />
    </form>
  );
};

type ShowMode = boolean | "mobile" | "desktop";

type ContainerProps = {
  mode: ShowMode | undefined;
  children: React.ReactNode;
};

const SidebarContainer = ({ children, mode }: ContainerProps) => {
  if (mode === false) return null;
  if (mode === true || mode === undefined) return children;

  return (
    <div
      className={cn(
        mode === "mobile" && "lg:hidden",
        mode === "desktop" && "hidden lg:block"
      )}
    >
      {children}
    </div>
  );
};

type Props = {
  show?: {
    search?: ShowMode;
    trends?: ShowMode;
  };
};

const SidebarLayout = ({ show }: Props) => {
  return (
    <div className="flex flex-col gap-6 px-2 py-4 lg:container sm:px-4 lg:flex-row lg:gap-4 xl:px-8">
      <aside className="flex flex-col gap-4 lg:order-2 lg:w-1/4">
        <SidebarContainer mode={show?.search}>
          <PostSearch />
        </SidebarContainer>
        <SidebarContainer mode={show?.trends}>
          <Trends />
        </SidebarContainer>
      </aside>
      <main className="overflow-x-hidden lg:w-3/4 lg:border-r lg:pr-4">
        <Outlet />
      </main>
    </div>
  );
};

export default SidebarLayout;
