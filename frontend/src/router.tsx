import { createBrowserRouter } from "react-router-dom";
import App from "@/App";
import DashboardLayout from "./components/layouts/DashboardLayout";
import Page404 from "./pages/Page404";
import Login from "./pages/Login";
import RootLayout from "./components/layouts/RootLayout";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Braches from "./pages/Branches";
import SavingSeasons from "./pages/SavingSeasons";
import Members from "./pages/Members";
import Groups from "./pages/Groups";
import Contributions from "./pages/Contributions";
import Loans from "./pages/Loans";
import Fines from "./pages/Fines";
import ExpenseCategories from "./pages/ExpenseCategories";
import PaymentMethods from "./pages/PaymentMethods";
import RolesPermissions from "./pages/RolesPermissions";
import SystemUsers from "./pages/SystemUsers";
import AccountSettings from "./pages/AccountSettings";
import GeneralSettings from "./pages/GeneralSettings";
import Expenses from "./pages/Expenses";
import Attendance from "./pages/Attendance";
import ExpensesReport from "./pages/ExpensesReport";
import ContributionsReport from "./pages/ContributionsReport";
import GeneralSeasonsReport from "./pages/GeneralSeasonsReport";
import LoanReports from "./pages/LoansReport";
import { AdminRoute, PermissionRoute } from "./components/ui/guards/RoutesGuard";

const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      {
        element: <RootLayout />,
        children: [
          {
            path: "/",
            element: <Login />,
          },
          {
            path: "/forgot-password",
            element: <ForgotPassword />,
          },
          {
            path: "/reset-password",
            element: <ResetPassword />,
          },
        ],
      },

      {
        element: <RootLayout />,
        children: [
          {
            element: <DashboardLayout />,
            handle: { crumb: () => "Dashboard" },
            children: [
              {
                element: <Dashboard />,
                path: "dashboard",
                handle: { crumb: () => "Overview" },
              },
              {
                // Available to all users
                element: <Members />,
                path: "members",
                handle: { crumb: () => "Members" },
              },
              {
                // Admin-only route
                element: <AdminRoute />,
                children: [
                  {
                    element: <Braches />,
                    path: "branches",
                    handle: { crumb: () => "Branches" },
                  },
                ],
              },
              {
                // Admin-only route
                element: <AdminRoute />,
                children: [
                  {
                    element: <SavingSeasons />,
                    path: "saving-seasons",
                    handle: { crumb: () => "Saving Seasons" },
                  },
                ],
              },
              {
                // Protected route with groups permission
                element: <PermissionRoute requiredPermissions={[["groups", "read"]]} />,
                children: [
                  {
                    element: <Groups />,
                    path: "saving-groups",
                    handle: { crumb: () => "Saving Groups" },
                  },
                ],
              },
              {
                // Available to all users
                element: <Contributions />,
                path: "contributions",
                handle: { crumb: () => "Contributions" },
              },
              {
                // Available to all users
                element: <Loans />,
                path: "loans",
                handle: { crumb: () => "Loans" },
              },
              {
                // Admin-only route
                element: <AdminRoute />,
                children: [
                  {
                    element: <Fines />,
                    path: "fines",
                    handle: { crumb: () => "Fines" },
                  },
                ],
              },
              {
                // Available to all users
                element: <Expenses />,
                path: "expenses",
                handle: { crumb: () => "Expenses" },
              },
              {
                // Admin-only route
                element: <AdminRoute />,
                children: [
                  {
                    element: <Attendance />,
                    path: "attendance",
                    handle: { crumb: () => "attendance" },
                  },
                ],
              },
            ],
          },
          {
            path: "reports",
            element: <AdminRoute />,
            children: [
              {
                element: <DashboardLayout />,
                handle: { crumb: () => "Reports" },
                children: [
                  {
                    element: <ExpensesReport />,
                    path: "expense-reports",
                    handle: { crumb: () => "Expenses Reports" },
                  },
                  {
                    element: <ContributionsReport />,
                    path: "contributions-reports",
                    handle: { crumb: () => "Contributions Report" },
                  },
                  {
                    element: <LoanReports />,
                    path: "loans-reports",
                    handle: { crumb: () => "Loans Reports" },
                  },
                  {
                    element: <GeneralSeasonsReport />,
                    path: "general-season-reports",
                    handle: { crumb: () => "General season reports" },
                  },
                ],
              },
            ],
          },
          {
            path: "settings",
            element: <PermissionRoute requiredPermissions={[["roles", "read"]]} />,
            children: [
              {
                element: <DashboardLayout />,
                handle: { crumb: () => "Settings" },
                children: [
                  {
                    element: <AccountSettings />,
                    path: "account-settings",
                    handle: { crumb: () => "Account settings" },
                  },
                  {
                    element: <AdminRoute />,
                    children: [
                      {
                        element: <ExpenseCategories />,
                        path: "expense-categories",
                        handle: { crumb: () => "Expenses Categories" },
                      },
                    ],
                  },
                  {
                    element: <AdminRoute />,
                    children: [
                      {
                        element: <PaymentMethods />,
                        path: "payment-methods",
                        handle: { crumb: () => "Payment Methods" },
                      },
                    ],
                  },
                  {
                    element: <AdminRoute />,
                    children: [
                      {
                        element: <SystemUsers />,
                        path: "system-users",
                        handle: { crumb: () => "System Users" },
                      },
                    ],
                  },
                  {
                    element: <AdminRoute />,
                    children: [
                      {
                        element: <RolesPermissions />,
                        path: "role-permissions",
                        handle: { crumb: () => "Roles & permissions" },
                      },
                    ],
                  },
                  {
                    element: <AdminRoute />,
                    children: [
                      {
                        element: <GeneralSettings />,
                        path: "general-information",
                        handle: { crumb: () => "General settings" },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: "*",
        element: <Page404 />,
        handle: { crumb: () => "Page not found" },
      },
    ],
  },
]);

export default router;