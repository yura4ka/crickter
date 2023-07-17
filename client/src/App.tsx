import CreatePost from "./features/posts/CreatePost";

function App() {
  return (
    <div className="flex sm:container">
      <main className="w-3/4 border-r py-4 pr-4">
        <CreatePost />
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
