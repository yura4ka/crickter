import { useNavigate, useParams } from "react-router-dom";
import { Post, useGetPostByIdQuery } from "./postsApiSlice";
import PostCard from "./PostCard";
import CreatePost from "./CreatePost";
import {
  commentsAdapter,
  commentsSelector,
  useGetCommentResponsesMutation,
  useGetCommentsQuery,
} from "./commentsApiSlice";
import { FC, useRef, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { useInfiniteScroll } from "@/lib/hooks";
import { cn } from "@/lib/utils";

interface CommentsCardProps {
  comment: Post & { responses?: Post[] };
  postId: string;
  responseToId?: string;
  originalId?: string;
}

const CommentsCard: FC<CommentsCardProps> = ({
  comment,
  postId,
  originalId,
  responseToId,
}) => {
  const [loadResponses, { isLoading }] = useGetCommentResponsesMutation();
  const [isResponseShown, setIsResponseShown] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(() => comment.comments > 0);

  const loaderDiv = useRef<HTMLDivElement>(null);
  useInfiniteScroll(loaderDiv, async () => {
    if (hasMore && !isLoading && isResponseShown) {
      const data = await loadResponses({ page, commentId: comment.id, postId }).unwrap();
      setPage((p) => p + 1);
      setHasMore(data.hasMore);
    }
  });

  return (
    <>
      <PostCard
        post={comment}
        onCommentClick={() => setIsResponseShown((prev) => !prev)}
        type={originalId ? "response" : "comment"}
      />
      <div className={cn("ml-8 divide-y sm:ml-16", !isResponseShown && "hidden")}>
        <CreatePost
          type="response"
          commentToId={postId}
          responseToId={responseToId}
          originalId={originalId}
          className="py-4"
        />
        {comment.responses?.map((r) => (
          <CommentsCard
            key={r.id}
            comment={r}
            postId={postId}
            originalId={r.id}
            responseToId={responseToId}
          />
        ))}
        <PostCard
          ref={loaderDiv}
          post={undefined}
          className={hasMore || isLoading ? "" : "hidden"}
        />
      </div>
    </>
  );
};

const PostPage = () => {
  const navigate = useNavigate();
  const { isLoading: isAuthLoading } = useAuth();
  const { postId } = useParams();
  const { data: post } = useGetPostByIdQuery(postId || "", { skip: !postId });
  const [page, setPage] = useState(1);
  const { comments, hasMore, isFetching } = useGetCommentsQuery(
    { page, postId: postId || "" },
    {
      skip: isAuthLoading,
      selectFromResult: ({ data, ...other }) => ({
        comments: commentsSelector.selectAll(
          data?.comments ?? commentsAdapter.getInitialState()
        ),
        hasMore: (data?.total ?? 0) > (post?.comments ?? 0),
        ...other,
      }),
    }
  );

  const loaderDiv = useRef<HTMLDivElement>(null);
  useInfiniteScroll(loaderDiv, () => {
    if (hasMore && !isFetching && !isAuthLoading) {
      setPage((p) => p + 1);
    }
  });

  if (!postId) {
    return navigate("/");
  }

  return (
    <main className="overflow-x-hidden px-2 pb-4 sm:container">
      <PostCard post={post} className="my-2 border-b" />
      <div className="pt-2">
        <h3 className="pb-4 text-lg">{post?.comments} comments</h3>
        <CreatePost type="comment" commentToId={postId} />
        <div className="my-2 divide-y">
          {comments.map((c) => (
            <CommentsCard key={c.id} comment={c} postId={postId} responseToId={c.id} />
          ))}
          <PostCard
            ref={loaderDiv}
            post={undefined}
            className={hasMore || isFetching ? "" : "hidden"}
          />
        </div>
      </div>
    </main>
  );
};

export default PostPage;
