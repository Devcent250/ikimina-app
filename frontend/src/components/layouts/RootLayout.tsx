import { useAuth } from "@/context/auth.context";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function RootLayout() {
  const { user, loading } = useAuth();

  const location = useLocation();

  if (loading && location.pathname !== "/") {
    return (
      <div className=" w-screen h-dvh bg-white flex items-center justify-center flex-col gap-8">
        <div className="flex items-center justify-center flex-col gap-6">
          <div className="w-full- m-auto-">
            <div className="loader" />
          </div>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    if (
      location.pathname === "/" ||
      location.pathname === "/forgot-password" ||
      location.pathname === "/reset-password"
    )
      return <Outlet />;
    return <Navigate to={`/?redirect=${location.pathname}`} />;
  }

  return (
    <>
      <Outlet />
    </>
  );
}
