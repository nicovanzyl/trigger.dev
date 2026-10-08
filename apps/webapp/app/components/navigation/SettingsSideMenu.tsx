import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { type ReactNode } from "react";
import { useIsImpersonating } from "~/hooks/useOrganizations";
import { useUser } from "~/hooks/useUser";
import { SideMenuItem } from "./SideMenuItem";
import {
  SideMenuFooterControls,
  SideMenuScroll,
  SideMenuShell,
  useSideMenuLayout,
} from "./SideMenuLayout";

/** Settings swap navigation content while retaining the app sidebar's dimensions and controls. */
export function SettingsSideMenu({
  backTo,
  organizationId,
  children,
}: {
  backTo: string;
  organizationId?: string;
  children: (isCollapsed: boolean) => ReactNode;
}) {
  const user = useUser();
  const isImpersonating = useIsImpersonating();
  const layout = useSideMenuLayout({ ...user, isImpersonating });

  return (
    <SideMenuShell layout={layout}>
      <div className="absolute inset-0 grid grid-cols-[100%] grid-rows-[3rem_1fr_auto] overflow-hidden">
        <div className="flex min-w-0 items-center overflow-hidden border-b border-transparent p-1">
          <SideMenuItem
            name="Back to app"
            icon={ArrowLeftIcon}
            to={backTo}
            isActive={false}
            isCollapsed={layout.isCollapsed}
            nameClassName="text-text-bright"
          />
        </div>
        <SideMenuScroll layout={layout}>{children(layout.isCollapsed)}</SideMenuScroll>
        <div className="flex flex-col gap-1 border-t border-grid-bright p-1">
          <SideMenuFooterControls
            isCollapsed={layout.isCollapsed}
            isDragging={layout.isDragging}
            onToggleCollapsed={layout.handleToggleCollapsed}
            organizationId={organizationId}
          />
        </div>
      </div>
    </SideMenuShell>
  );
}
