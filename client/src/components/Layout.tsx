import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import LoginModal from "@/features/loginModal/LoginModal";
import RepostModal from "@/features/posts/RepostModal";

const Layout = () => {
  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_auto]">
      <Navbar />
      <Outlet />
      <Footer />
      <LoginModal />
      <RepostModal />
      <lr-config
        ctx-name="post-uploader"
        pubkey="2ac4018b8e52c68924ae"
        maxLocalFileSizeBytes={5000000}
        imgOnly={true}
        sourceList="local, url, camera"
        use-cloud-image-editor="true"
      ></lr-config>
      <lr-headless-modal
        ctx-name="post-uploader"
        css-src="https://cdn.jsdelivr.net/npm/@uploadcare/blocks@0.25.0/web/lr-file-uploader-regular.min.css"
        class="uploadcare-config"
      ></lr-headless-modal>
    </div>
  );
};
export default Layout;
