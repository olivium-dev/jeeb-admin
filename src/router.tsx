import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { LoginPage } from "@/auth/LoginPage";
import { TwoFactorPage } from "@/auth/TwoFactorPage";
import { RequireAuth } from "@/auth/RequireAuth";
import { AppLayout } from "@/shell/AppLayout";
import { DashboardPage } from "@/pages/Dashboard";
import { Placeholder } from "@/pages/Placeholder";
import { ProhibitedItemsPage } from "@/pages/ProhibitedItems";
import { KycQueuePage } from "@/pages/KycQueue";
import { UsersAdminPage } from "@/pages/UsersAdmin";
import { DisputeQueuePage } from "@/pages/Disputes";
import { FinanceDashboardPage } from "@/pages/Finance";
import { OperationsDashboardPage } from "@/pages/Operations";
import { SettlementManagementPage } from "@/pages/Settlements";
import { NotFoundPage } from "@/pages/NotFound";

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/2fa", element: <TwoFactorPage /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      {
        path: "kyc",
        element: (
          <RequireAuth roles={["kyc.reviewer", "superuser"]}>
            <KycQueuePage />
          </RequireAuth>
        ),
      },
      {
        path: "disputes",
        element: (
          <RequireAuth roles={["disputes.agent", "superuser"]}>
            <DisputeQueuePage />
          </RequireAuth>
        ),
      },
      {
        path: "finance",
        element: (
          <RequireAuth
            roles={["finance.viewer", "finance.ops", "superuser"]}
          >
            <FinanceDashboardPage />
          </RequireAuth>
        ),
      },
      {
        path: "ops",
        element: (
          <RequireAuth roles={["ops.viewer", "superuser"]}>
            <OperationsDashboardPage />
          </RequireAuth>
        ),
      },
      {
        path: "users",
        element: (
          <RequireAuth roles={["users.admin", "superuser"]}>
            <UsersAdminPage />
          </RequireAuth>
        ),
      },
      {
        path: "prohibited-items",
        element: (
          <RequireAuth roles={["ops.viewer", "superuser"]}>
            <ProhibitedItemsPage />
          </RequireAuth>
        ),
      },
      {
        path: "settlements",
        element: (
          <RequireAuth roles={["finance.ops", "superuser"]}>
            <SettlementManagementPage />
          </RequireAuth>
        ),
      },
      {
        path: "audit",
        element: (
          <RequireAuth roles={["superuser"]}>
            <Placeholder
              title="Audit log"
              description="Append-only log of all admin mutations."
              ticket="T-web-007"
            />
          </RequireAuth>
        ),
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
