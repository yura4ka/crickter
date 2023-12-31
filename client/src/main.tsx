import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import * as LR from "@uploadcare/blocks";
import { Provider } from "react-redux";
import { store } from "./app/store.ts";
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import Layout from "./components/layout/Layout.tsx";
import AuthLayout from "./features/auth/AuthLayout.tsx";
import Login from "./features/auth/Login.tsx";
import Register from "./features/auth/Register.tsx";
import UserPage from "./features/user/UserPage.tsx";
import { ThemeProvider } from "./lib/ThemeContext.tsx";
import TagPage from "./features/tags/TagPage.tsx";
import TagPostsPage from "./features/tags/TagPostsPage.tsx";
import HeadlessModal from "./lib/HeadlessModal.ts";
import SettingsPage from "./features/user/SettingsPage.tsx";
import SidebarLayout from "./components/layout/SidebarLayout.tsx";
import {
  FavoritePostsPage,
  PostHistoryPage,
  PostPage,
  SearchPostsPage,
} from "@/features/posts/pages";

LR.registerBlocks({ ...LR, HeadlessModal });

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />

      <Route element={<SidebarLayout />}>
        <Route index element={<App />} />
        <Route path="post/search" element={<SearchPostsPage />} />
        <Route path="post/:postId" element={<PostPage />} />
        <Route path="tags" element={<TagPage />} />
        <Route path="tags/:tag" element={<TagPostsPage />} />
      </Route>
      <Route element={<SidebarLayout show={{ trends: "desktop" }} />}>
        <Route path="user/:userId" element={<UserPage />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route element={<SidebarLayout />}>
          <Route path="favorite" element={<FavoritePostsPage />} />
        </Route>
        <Route path="post/:postId/history" element={<PostHistoryPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Route>
  )
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
