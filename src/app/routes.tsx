import { createBrowserRouter } from "react-router";
import { HomePage } from "./pages/HomePage";
import { AddRecipePage } from "./pages/AddRecipePage";
import { ShoppingListPage } from "./pages/ShoppingListPage";
import { RecipeDetailPage } from "./pages/RecipeDetailPage";
import { AboutPage } from "./pages/AboutPage";
import { ProfilePage } from "./pages/ProfilePage";
import { Layout } from "./components/Layout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: "add", Component: AddRecipePage },
      { path: "shopping-list", Component: ShoppingListPage },
      { path: "recipe/:id", Component: RecipeDetailPage },
      { path: "about", Component: AboutPage },
      { path: "profile", Component: ProfilePage },
    ],
  },
]);