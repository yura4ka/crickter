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
    </div>
  );
};
export default Layout;
