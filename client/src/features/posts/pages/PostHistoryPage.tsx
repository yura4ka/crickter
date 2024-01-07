import { useNavigate, useParams } from "react-router-dom";
import { useGetPostHistoryQuery } from "../slices/postsApiSlice";
import { formatText } from "../utils/textFormatter";
import { PostGallery } from "../components/PostGallery";
import { Loader2 } from "lucide-react";

const PostHistoryPage = () => {
  const navigate = useNavigate();
  const { postId } = useParams();

  const { data, isLoading, isError } = useGetPostHistoryQuery(postId ?? "", {
    skip: !postId,
  });

  if (!postId || isError) {
    navigate("/");
    return <></>;
  }

  if (!data || isLoading) {
    return (
      <main className="px-2 pb-2 sm:container">
        <h1 className="my-6 border-b pb-2 text-2xl">Changes</h1>
        <section className="grid place-content-center">
          <Loader2 className="h-10 w-10 animate-spin" />
        </section>
      </main>
    );
  }

  return (
    <main className="px-2 pb-2 sm:container">
      <h1 className="my-6 border-b pb-2 text-2xl">Changes</h1>
      <ol className="relative border-l">
        {data.map((h) => (
          <li key={h.date} className="mb-10 ml-4">
            <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border bg-border"></div>
            <time className="mb-1 text-sm leading-none text-muted-foreground">
              {new Date(h.date).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "medium",
              })}
            </time>
            {h.text !== undefined && (
              <h3 className="italic text-muted-foreground">
                {h.isDeleted ? "deleted" : `text ${h.text ? "changed:" : "deleted"}`}
              </h3>
            )}
            {!h.isDeleted && h.text && <div>{formatText(h.text)}</div>}
            {h.addMedia.length !== 0 && (
              <div>
                <h3 className="italic text-muted-foreground">added media:</h3>
                <PostGallery media={h.addMedia} />
              </div>
            )}
            {h.deletedMedia.length !== 0 && (
              <div className="mt-2">
                <h3 className="italic text-muted-foreground">deleted media:</h3>
                <PostGallery media={h.deletedMedia} />
              </div>
            )}
          </li>
        ))}
      </ol>
    </main>
  );
};

export { PostHistoryPage };
