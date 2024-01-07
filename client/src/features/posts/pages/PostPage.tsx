import { useNavigate, useParams } from "react-router-dom";
import { Post, useGetPostByIdQuery } from "../slices/postsApiSlice";
import { CreatePost, PostCard } from "@/features/posts/components";
import {
  commentsAdapter,
  commentsSelector,
  useGetCommentResponsesMutation,
  useGetCommentsQuery,
} from "../slices/commentsApiSlice";
import { FC, useEffect, useRef, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { useInfiniteScroll } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import { useIsBlockedQuery } from "../../user/userApiSlice";

interface CommentsCardProps {
  comment: Post & { responses?: Post[] };
  postId: string;
  responseToId?: string;
  originalId?: string;
  canComment: boolean;
}

const CommentsCard: FC<CommentsCardProps> = ({
  comment,
  postId,
  originalId,
  responseToId,
  canComment,
}) => {
  const [loadResponses, { isLoading }] = useGetCommentResponsesMutation();
  const [isResponseShown, setIsResponseShown] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(() => comment.responseCount > 0);

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
        {canComment && (
          <CreatePost
            type="response"
            commentToId={postId}
            responseToId={responseToId}
            originalId={originalId}
            className="py-4"
          />
        )}
        {comment.responses?.map((r) => (
          <CommentsCard
            key={r.id}
            comment={r}
            postId={postId}
            originalId={r.id}
            responseToId={responseToId}
            canComment={canComment}
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
  const {
    data: post,
    isLoading: isPostLoading,
    isError,
  } = useGetPostByIdQuery(postId || "", {
    skip: !postId,
  });
  const [page, setPage] = useState(1);
  const { comments, hasMore, total, isFetching } = useGetCommentsQuery(
    { page, postId: postId || "" },
    {
      skip: isAuthLoading || !postId,
      selectFromResult: ({ data, ...other }) => ({
        comments: commentsSelector.selectAll(
          data?.comments ?? commentsAdapter.getInitialState()
        ),
        hasMore: data?.hasMore,
        total: data?.total,
        ...other,
      }),
    }
  );

  const userId = !post?.isDeleted ? post?.user.id ?? "" : "";

  const { data: isBlocked } = useIsBlockedQuery(
    { userId, meBlocked: true },
    { skip: !userId }
  );

  useEffect(() => {
    if (post && post.commentToId && !isPostLoading) {
      navigate("/post/" + post.commentToId, { replace: true });
    }
  }, [isPostLoading, navigate, post]);

  const loaderDiv = useRef<HTMLDivElement>(null);
  useInfiniteScroll(loaderDiv, () => {
    if (hasMore && !isFetching && !isAuthLoading) {
      setPage((p) => p + 1);
    }
  });

  if (!postId || isError) {
    navigate("/");
    return <></>;
  }

  return (
    <main className="overflow-x-hidden px-2 pb-4 sm:container">
      <PostCard post={post} className="my-2 border-b" />
      <div className="pt-2">
        <h3 className="pb-4 text-lg">{total} comments</h3>
        {!post?.canComment && !isPostLoading ? (
          <div className="flex gap-2 rounded border p-4">
            <Lock />
            Commenting has been disabled for this post...
          </div>
        ) : isBlocked === true ? (
          <div className="flex gap-2 rounded border p-4">
            <Lock />
            You has been blocked by this user...
          </div>
        ) : (
          <CreatePost type="comment" commentToId={postId} />
        )}

        <div className="my-2 divide-y">
          {comments.map((c) => (
            <CommentsCard
              key={c.id}
              comment={c}
              postId={postId}
              responseToId={c.id}
              canComment={(post?.canComment && !isBlocked) ?? false}
            />
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

export { PostPage };
