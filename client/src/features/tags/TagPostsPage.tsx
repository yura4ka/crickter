import { useParams } from "react-router-dom";

const TagPostsPage = () => {
  const { tag } = useParams();
  console.log(tag);
  return <div>TagPostsPage</div>;
};

export default TagPostsPage;
