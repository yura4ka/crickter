import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Provider } from "react-redux";
import { store } from "./app/store.ts";
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import Layout from "./components/Layout.tsx";
import AuthLayout from "./features/auth/AuthLayout.tsx";
import Login from "./features/auth/Login.tsx";
import Register from "./features/auth/Register.tsx";
import UserPage from "./features/user/UserPage.tsx";
import { ThemeProvider } from "./lib/ThemeContext.tsx";
import PostPage from "./features/posts/PostPage.tsx";
import FavoritePostsPage from "./features/posts/FavoritePostsPage.tsx";
import TagPage from "./features/tags/TagPage.tsx";
import TagPostsPage from "./features/tags/TagPostsPage.tsx";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route index element={<App />} />
      <Route path="post/:postId" element={<PostPage />} />
      <Route path="user/:userId" element={<UserPage />} />
      <Route path="tags" element={<TagPage />} />
      <Route path="tags/:tag" element={<TagPostsPage />} />

      <Route element={<AuthLayout />}>
        <Route path="favorite" element={<FavoritePostsPage />} />
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
