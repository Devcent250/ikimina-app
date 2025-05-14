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
import Districts from "./pages/Districts";

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
                element: <Members />,
                path: "members",
                handle: { crumb: () => "Members" },
              },
              {
                element: <Districts />,
                path: "districts",
                handle: { crumb: () => "Districts" },
              },
              {
                element: <Braches />,
                path: "zones",
                handle: { crumb: () => "Zones" },
              },
              {
                element: <SavingSeasons />,
                path: "saving-seasons",
                handle: { crumb: () => "Saving Seasons" },
              },
              {
                element: <Groups />,
                path: "saving-groups",
                handle: { crumb: () => "Saving Groups" },
              },
              {
                element: <Contributions />,
                path: "contributions",
                handle: { crumb: () => "Contributions" },
              },
              {
                element: <Loans />,
                path: "loans",
                handle: { crumb: () => "Loans" },
              },
              {
                element: <Fines />,
                path: "fines",
                handle: { crumb: () => "Fines" },
              },
              {
                element: <Expenses />,
                path: "expenses",
                handle: { crumb: () => "Expenses" },
              },
              {
                element: <Attendance />,
                path: "attendance",
                handle: { crumb: () => "attendance" },
              },
            ],
          },
          {
            path: "reports",
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
          {
            path: "settings",
            element: <DashboardLayout />,
            handle: { crumb: () => "Settings" },
            children: [
              {
                element: <AccountSettings />,
                path: "account-settings",
                handle: { crumb: () => "Account settings" },
              },
              {
                element: <ExpenseCategories />,
                path: "expense-categories",
                handle: { crumb: () => "Expenses Categories" },
              },
              {
                element: <PaymentMethods />,
                path: "payment-methods",
                handle: { crumb: () => "Payment Methods" },
              },
              {
                element: <SystemUsers />,
                path: "system-users",
                handle: { crumb: () => "System Users" },
              },
              {
                element: <RolesPermissions />,
                path: "role-permissions",
                handle: { crumb: () => "Roles & permissions" },
              },
              {
                element: <GeneralSettings />,
                path: "general-information",
                handle: { crumb: () => "General settings" },
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