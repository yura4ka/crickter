import { useAuth } from "./features/auth/useAuth";
import CreatePost from "./features/posts/CreatePost";
import PostCard from "./features/posts/PostCard";
import { useGetPostsQuery } from "./features/posts/postsApiSlice";

const Feed = () => {
  const { isLoading: isAuthLoading } = useAuth();
  const { data: posts, isFetching } = useGetPostsQuery(undefined, {
    skip: isAuthLoading,
  });

  return (
    <div className="divide-y">
      {posts?.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
};

function App() {
  return (
    <div className="flex sm:container">
      <main className="w-3/4 border-r py-4 pr-4">
        <CreatePost />
        <Feed />
      </main>
      <aside className="flex w-1/4 flex-col p-4">
        <input type="search" className="bg-accent" placeholder="search" />
        <div className="mt-4 rounded bg-accent p-2 text-accent-foreground">
          <h3>Trending</h3>
          <div>
            <p>abc</p>
            <p>bcd</p>
            <p>efg</p>
          </div>
          <p className="link">Show more</p>
        </div>
      </aside>
    </div>
  );
}

export default App;
