import { SettingsSideMenu } from "./SettingsSideMenu";
import { BellIcon } from "~/assets/icons/BellIcon";
import { ChainLinkIcon } from "~/assets/icons/ChainLinkIcon";
import { CreditCardIcon } from "~/assets/icons/CreditCardIcon";
import { FolderOpenIcon } from "~/assets/icons/FolderOpenIcon";
import { PadlockIcon } from "~/assets/icons/PadlockIcon";
import { ShieldIcon } from "~/assets/icons/ShieldIcon";
import { UsageIcon } from "~/assets/icons/UsageIcon";
import { RolesIcon } from "~/assets/icons/RolesIcon";
import { SlackIcon } from "~/assets/icons/SlackIcon";
import { SlidersIcon } from "~/assets/icons/SlidersIcon";
import { UserGroupIcon } from "~/assets/icons/UserGroupIcon";
import { VercelLogo } from "~/components/integrations/VercelLogo";
import { useFeatureFlags } from "~/hooks/useFeatureFlags";
import { useFeatures } from "~/hooks/useFeatures";
import { type MatchedOrganization } from "~/hooks/useOrganizations";
import {
  organizationPath,
  organizationProjectsPath,
  organizationRolesPath,
  organizationSettingsPath,
  organizationSlackIntegrationPath,
  organizationSsoPath,
  organizationSupportAccessPath,
  organizationTeamPath,
  organizationVercelIntegrationPath,
  v3BillingLimitsPath,
  v3BillingPath,
  v3PrivateConnectionsPath,
  v3UsagePath,
} from "~/utils/pathBuilder";
import { SideMenuHeader } from "./SideMenuHeader";
import { SideMenuItem } from "./SideMenuItem";
import { useShowSelfServe } from "~/hooks/useShowSelfServe";
import { useCurrentPlan } from "~/routes/_app.orgs.$organizationSlug/route";
import { Paragraph } from "../primitives/Paragraph";
import { Badge } from "../primitives/Badge";
import { useHasAdminAccess } from "~/hooks/useUser";

export type BuildInfo = {
  appVersion: string | undefined;
  packageVersion: string;
  buildTimestampSeconds: string | undefined;
  gitSha: string | undefined;
  gitRefName: string | undefined;
};

export function OrganizationSettingsSideMenu({
  organization,
  buildInfo,
  isUsingPlugin,
  isSsoUsingPlugin,
}: {
  organization: MatchedOrganization;
  buildInfo: BuildInfo;
  isUsingPlugin: boolean;
  isSsoUsingPlugin: boolean;
}) {
  const { isManagedCloud } = useFeatures();
  const featureFlags = useFeatureFlags();
  const currentPlan = useCurrentPlan();
  const showSelfServe = useShowSelfServe();
  const isAdmin = useHasAdminAccess();
  const showBuildInfo = isAdmin || !isManagedCloud;

  return (
    <SettingsSideMenu backTo={organizationPath(organization)} organizationId={organization.id}>
      {(isCollapsed) => (
        <>
          <div className="flex flex-col">
            <div className="mb-1">
              <SideMenuHeader isCollapsed={isCollapsed} title="Organization" />
            </div>
            <SideMenuItem
              isCollapsed={isCollapsed}
              name="Settings"
              icon={SlidersIcon}
              activeIconColor="text-text-bright"
              inactiveIconColor="text-text-dimmed"
              to={organizationSettingsPath(organization)}
              data-action="settings"
            />
            {isManagedCloud && (
              <>
                <SideMenuItem
                  isCollapsed={isCollapsed}
                  name="Usage"
                  icon={UsageIcon}
                  activeIconColor="text-text-bright"
                  inactiveIconColor="text-text-dimmed"
                  to={v3UsagePath(organization)}
                  data-action="usage"
                />
                <SideMenuItem
                  isCollapsed={isCollapsed}
                  name="Billing"
                  icon={CreditCardIcon}
                  activeIconColor="text-text-bright"
                  inactiveIconColor="text-text-dimmed"
                  to={v3BillingPath(organization)}
                  data-action="billing"
                  badge={
                    currentPlan?.v3Subscription?.isPaying ? (
                      <Badge variant="extra-small">
                        {currentPlan?.v3Subscription?.plan?.title}
                      </Badge>
                    ) : undefined
                  }
                />
                {showSelfServe ? (
                  <SideMenuItem
                    isCollapsed={isCollapsed}
                    name="Billing limits"
                    icon={BellIcon}
                    activeIconColor="text-text-bright"
                    inactiveIconColor="text-text-dimmed"
                    to={v3BillingLimitsPath(organization)}
                    data-action="billing-limits"
                  />
                ) : null}
              </>
            )}
            <SideMenuItem
              isCollapsed={isCollapsed}
              name="Projects"
              icon={FolderOpenIcon}
              activeIconColor="text-text-bright"
              inactiveIconColor="text-text-dimmed"
              to={organizationProjectsPath(organization)}
              data-action="projects"
            />
            <SideMenuItem
              isCollapsed={isCollapsed}
              name="Team"
              icon={UserGroupIcon}
              activeIconColor="text-text-bright"
              inactiveIconColor="text-text-dimmed"
              to={organizationTeamPath(organization)}
              data-action="team"
            />
            {featureFlags.hasPrivateConnections && (
              <SideMenuItem
                isCollapsed={isCollapsed}
                name="Private Connections"
                icon={ChainLinkIcon}
                activeIconColor="text-text-bright"
                inactiveIconColor="text-text-dimmed"
                to={v3PrivateConnectionsPath(organization)}
                data-action="private-connections"
              />
            )}
            {isUsingPlugin && (
              <SideMenuItem
                isCollapsed={isCollapsed}
                name="Roles"
                icon={RolesIcon}
                activeIconColor="text-text-bright"
                inactiveIconColor="text-text-dimmed"
                to={organizationRolesPath(organization)}
                data-action="roles"
              />
            )}
            {isSsoUsingPlugin && (
              <SideMenuItem
                isCollapsed={isCollapsed}
                name="SSO & Directory Sync"
                icon={PadlockIcon}
                activeIconColor="text-text-bright"
                inactiveIconColor="text-text-dimmed"
                to={organizationSsoPath(organization)}
                data-action="sso"
              />
            )}
            {/* Same rule as the page: flag on, or the org already requires requests. */}
            {isManagedCloud &&
              (featureFlags.supportAccessSettingsEnabled === true ||
                organization.supportAccessMode === "REQUIRES_REQUEST") && (
                <SideMenuItem
                  isCollapsed={isCollapsed}
                  name="Support Access"
                  icon={ShieldIcon}
                  activeIconColor="text-text-bright"
                  inactiveIconColor="text-text-dimmed"
                  to={organizationSupportAccessPath(organization)}
                  data-action="support-access"
                />
              )}
          </div>
          <div className="flex flex-col">
            <div className="mb-1">
              <SideMenuHeader isCollapsed={isCollapsed} title="Integrations" />
            </div>
            <SideMenuItem
              isCollapsed={isCollapsed}
              name="Vercel"
              icon={VercelLogo}
              activeIconColor="text-text-bright"
              inactiveIconColor="text-text-dimmed"
              to={organizationVercelIntegrationPath(organization)}
              data-action="integrations"
            />
            <SideMenuItem
              isCollapsed={isCollapsed}
              name="Slack"
              icon={SlackIcon}
              activeIconColor="text-text-bright"
              inactiveIconColor="text-text-dimmed"
              to={organizationSlackIntegrationPath(organization)}
              data-action="integrations"
            />
          </div>
          <div
            className="flex flex-col gap-1"
            hidden={isCollapsed}
            style={{ opacity: "var(--sm-label-opacity, 1)" }}
          >
            <SideMenuHeader isCollapsed={isCollapsed} title="App version" />
            <Paragraph variant="extra-small" className="break-words px-2 text-xs text-text-dimmed">
              {buildInfo.appVersion || `v${buildInfo.packageVersion}`}
            </Paragraph>
          </div>
          {showBuildInfo && buildInfo.buildTimestampSeconds && (
            <div
              className="flex flex-col gap-1"
              hidden={isCollapsed}
              style={{ opacity: "var(--sm-label-opacity, 1)" }}
            >
              <SideMenuHeader isCollapsed={isCollapsed} title="Build timestamp" />
              <Paragraph
                variant="extra-small"
                className="break-words px-2 text-xs text-text-dimmed"
              >
                {new Date(Number(buildInfo.buildTimestampSeconds) * 1000).toISOString()}
              </Paragraph>
            </div>
          )}
          {showBuildInfo && buildInfo.gitRefName && (
            <div
              className="flex flex-col gap-1"
              hidden={isCollapsed}
              style={{ opacity: "var(--sm-label-opacity, 1)" }}
            >
              <SideMenuHeader isCollapsed={isCollapsed} title="Git ref" />
              <Paragraph
                variant="extra-small"
                className="break-words px-2 text-xs text-text-dimmed"
              >
                <a
                  href={`https://github.com/triggerdotdev/trigger.dev/tree/${buildInfo.gitRefName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-text-bright"
                >
                  {buildInfo.gitRefName}
                </a>
              </Paragraph>
            </div>
          )}
          {showBuildInfo && buildInfo.gitSha && (
            <div
              className="flex flex-col gap-1"
              hidden={isCollapsed}
              style={{ opacity: "var(--sm-label-opacity, 1)" }}
            >
              <SideMenuHeader isCollapsed={isCollapsed} title="Git sha" />
              <Paragraph
                variant="extra-small"
                className="break-words px-2 text-xs text-text-dimmed"
              >
                <a
                  href={`https://github.com/triggerdotdev/trigger.dev/commit/${buildInfo.gitSha}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-text-bright"
                >
                  {buildInfo.gitSha.slice(0, 9)}
                </a>
              </Paragraph>
            </div>
          )}
        </>
      )}
    </SettingsSideMenu>
  );
}
