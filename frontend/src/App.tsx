import { QueryClient, QueryClientProvider } from "react-query";
import { Outlet } from "react-router-dom";
import { AuthProvider } from "./context/auth.context";
import { Toaster } from "sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: Infinity,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Toaster
            toastOptions={{
              classNames: {
                error: "!bg-red-50 !text-red-400 border-red-500",
                info: "bg-blue-400",
                success: "!bg-green-50 !text-green-400 !border-green-500",
                warning: "bg-orange-400 border-green-500",
                toast: "bg-blue-400",
                title: "text-sm font-sans",
                actionButton: "bg-zinc-400",
                cancelButton: "bg-orange-400",
                closeButton: "bg-lime-400",
              },
            }}
          />
          <Outlet />
        </AuthProvider>
      </QueryClientProvider>
    </>
  );
}

export default App;
