import { Outlet } from "@remix-run/react";
import { AppContainer, MainBody } from "~/components/layout/AppLayout";
import { AccountSideMenu } from "~/components/navigation/AccountSideMenu";

export default function Page() {
  return (
    <AppContainer>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] overflow-hidden">
        <AccountSideMenu />
        <MainBody>
          <Outlet />
        </MainBody>
      </div>
    </AppContainer>
  );
}
