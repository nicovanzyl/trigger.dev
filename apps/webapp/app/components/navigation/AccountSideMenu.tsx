import {
  accountPath,
  accountSecurityPath,
  personalAccessTokensPath,
  rootPath,
} from "~/utils/pathBuilder";
import { SideMenuHeader } from "./SideMenuHeader";
import { SideMenuItem } from "./SideMenuItem";
import { AvatarCircleIcon } from "~/assets/icons/AvatarCircleIcon";
import { ShieldIcon } from "~/assets/icons/ShieldIcon";
import { PadlockIcon } from "~/assets/icons/PadlockIcon";

import { SettingsSideMenu } from "./SettingsSideMenu";

export function AccountSideMenu() {
  return (
    <SettingsSideMenu backTo={rootPath()}>
      {(isCollapsed) => (
        <div>
          <div className="mb-1">
            <SideMenuHeader title="Account" isCollapsed={isCollapsed} />
          </div>
          <SideMenuItem
            isCollapsed={isCollapsed}
            name="Profile"
            icon={AvatarCircleIcon}
            activeIconColor="text-text-bright"
            to={accountPath()}
            data-action="account"
          />
          <SideMenuItem
            isCollapsed={isCollapsed}
            name="Personal Access Tokens"
            icon={ShieldIcon}
            activeIconColor="text-text-bright"
            to={personalAccessTokensPath()}
            data-action="tokens"
          />
          <SideMenuItem
            isCollapsed={isCollapsed}
            name="Security"
            icon={PadlockIcon}
            activeIconColor="text-text-bright"
            to={accountSecurityPath()}
            data-action="security"
          />
        </div>
      )}
    </SettingsSideMenu>
  );
}
