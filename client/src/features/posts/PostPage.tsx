import { useParams } from "react-router-dom";
import { useGetPostByIdQuery } from "./postsApiSlice";
import PostCard from "./PostCard";

const PostPage = () => {
  const { postId } = useParams();
  const { data: post } = useGetPostByIdQuery(postId || "", { skip: !postId });

  return (
    <main className="sm:container">
      <PostCard post={post} className="rounded border" />
    </main>
  );
};

export default PostPage;
