import {
  SIDE_MENU_PAD_X,
  SideMenuShell,
  SideMenuScroll,
  SideMenuFooterControls,
  useSideMenuLayout,
} from "./SideMenuLayout";
import { ArrowTopRightOnSquareIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import {
  Form,
  useFetcher,
  useLocation,
  useNavigation,
  useRevalidator,
  useSubmit,
} from "@remix-run/react";
import { WebhookIcon } from "~/assets/icons/WebhookIcon";
import { motion } from "framer-motion";
import { Fragment, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { AIChatIcon } from "~/assets/icons/AIChatIcon";
import { ArrowLeftRightIcon } from "~/assets/icons/ArrowLeftRightIcon";
import { ArrowRightSquareIcon } from "~/assets/icons/ArrowRightSquareIcon";
import { AvatarCircleIcon } from "~/assets/icons/AvatarCircleIcon";
import { BellIcon } from "~/assets/icons/BellIcon";
import { ChainLinkIcon } from "~/assets/icons/ChainLinkIcon";
import { DropdownIcon } from "~/assets/icons/DropdownIcon";
import { EyeClosedIcon } from "~/assets/icons/EyeClosedIcon";
import { EyeOpenIcon } from "~/assets/icons/EyeOpenIcon";
import { FolderClosedIcon } from "~/assets/icons/FolderClosedIcon";
import { FolderOpenIcon } from "~/assets/icons/FolderOpenIcon";
import { HomeIcon } from "~/assets/icons/HomeIcon";
import { IntegrationsIcon } from "~/assets/icons/IntegrationsIcon";
import { PlusIcon } from "~/assets/icons/PlusIcon";
import { RunsIcon } from "~/assets/icons/RunsIcon";
import { ShieldIcon } from "~/assets/icons/ShieldIcon";
import { SidebarCustomizeIcon } from "~/assets/icons/SidebarCustomizeIcon";
import { SlidersIcon } from "~/assets/icons/SlidersIcon";
import { TasksIcon } from "~/assets/icons/TasksIcon";
import { UsageIcon } from "~/assets/icons/UsageIcon";
import { CreditCardIcon } from "~/assets/icons/CreditCardIcon";
import { UserCrossIcon } from "~/assets/icons/UserCrossIcon";
import { UserGroupIcon } from "~/assets/icons/UserGroupIcon";
import { RolesIcon } from "~/assets/icons/RolesIcon";
import { PadlockIcon } from "~/assets/icons/PadlockIcon";
import { SlackIcon } from "~/assets/icons/SlackIcon";
import { VercelLogo } from "~/components/integrations/VercelLogo";
import { Avatar } from "~/components/primitives/Avatar";
import { UserProfilePhoto } from "~/components/UserProfilePhoto";
import { type MatchedEnvironment } from "~/hooks/useEnvironment";
import { usePageSwitcher } from "~/hooks/useEnvironmentSwitcher";
import { useFeatureFlags } from "~/hooks/useFeatureFlags";
import { useFeatures } from "~/hooks/useFeatures";
import { type MatchedOrganization } from "~/hooks/useOrganizations";
import { type MatchedProject } from "~/hooks/useProject";
import { useShowSelfServe } from "~/hooks/useShowSelfServe";
import { useHasAdminAccess, useIsViewingAsUser } from "~/hooks/useUser";
import { type UserWithDashboardPreferences } from "~/models/user.server";
import {
  useCurrentPlan,
  useIsUsingRbacPlugin,
  useIsUsingSsoPlugin,
} from "~/routes/_app.orgs.$organizationSlug/route";
import { type FeedbackType } from "~/routes/resources.feedback";
import { IncidentStatusPanel, useIncidentStatus } from "~/routes/resources.incidents";
import { cn } from "~/utils/cn";
import {
  accountPath,
  accountSecurityPath,
  personalAccessTokensPath,
  adminPath,
  docsPath,
  logoutPath,
  newOrganizationPath,
  newProjectPath,
  organizationRolesPath,
  organizationSettingsPath,
  organizationSlackIntegrationPath,
  organizationSsoPath,
  organizationTeamPath,
  organizationVercelIntegrationPath,
  v3BillingLimitsPath,
  v3BillingPath,
  v3PrivateConnectionsPath,
  v3EnvironmentPath,
  v3ProjectSettingsGeneralPath,
  v3RunsPath,
  v3SessionsPath,
  v3UsagePath,
  v3WebhooksPath,
} from "~/utils/pathBuilder";
import { FreePlanUsage } from "../billing/FreePlanUsage";
import { ConnectionIcon, DevPresencePanel, useDevPresence } from "../DevPresence";
import { NewBadge } from "../FeatureBadges";
import { Button, LinkButton } from "../primitives/Buttons";
import { Dialog, DialogTrigger } from "../primitives/Dialog";
import { type RenderIcon } from "../primitives/Icon";
import { Paragraph } from "../primitives/Paragraph";
import { Badge } from "../primitives/Badge";
import {
  Popover,
  PopoverContent,
  PopoverCustomTrigger,
  PopoverMenuItem,
  PopoverSectionHeader,
  PopoverTrigger,
} from "../primitives/Popover";
import { ShortcutKey } from "../primitives/ShortcutKey";
import {
  SimpleTooltip,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../primitives/Tooltip";
import { type FavoritePage } from "~/services/dashboardPreferences.server";
import { AppearanceMenuItem } from "./AppearanceMenuItem";
import {
  CustomizeSidebarDialog,
  type CustomizeSidebarSection,
  type SidebarCustomizationPayload,
} from "./CustomizeSidebarDialog";
import { CreateDashboardButton } from "./DashboardDialogs";
import { DashboardList } from "./DashboardList";
import { EnvironmentSelector } from "./EnvironmentSelector";
import {
  FAVORITES_ACTION_PATH,
  favoriteLinkTo,
  favoritePageIcon,
  favoritePageIconClassName,
  useFavorites,
} from "./favoritePages";
import { FavoriteMenuItem } from "./FavoritesSection";
import { NotificationPanel } from "./NotificationPanel";
import { SideMenuHeader } from "./SideMenuHeader";
import { SideMenuItem, SideMenuLabel } from "./SideMenuItem";
import { buildSideMenuSections, type SideMenuSectionConfig } from "./sideMenuSections";
import { SideMenuPopoverSubMenu } from "./SideMenuPopoverSubMenu";
import { SideMenuSection } from "./SideMenuSection";
import {
  isItemHidden,
  orderByPreference,
  SIDE_MENU_POPOVER_ITEM_ICON,
  SIDE_MENU_POPOVER_ITEM_LABEL,
  type SideMenuSectionId,
} from "./sideMenuTypes";

/** Get the collapsed state for a specific side menu section from user preferences */
function getSectionCollapsed(
  sideMenu: { collapsedSections?: Record<string, boolean> } | undefined,
  sectionId: SideMenuSectionId
): boolean {
  return sideMenu?.collapsedSections?.[sectionId] ?? false;
}

// Impersonation accent (menu border + "Exit Support Access"). Full class strings so Tailwind's
// static scanner picks them up.
const IMPERSONATION_ACCENT = {
  border: "border-yellow-500/80",
  text: "text-yellow-500/80",
};

/**
 * Hover chevron: its 18px width follows --sm-label-opacity so an invisible chevron never holds width
 * mid-drag and pushes the row's clip edge into the icon. Opacity stays class-driven (hover-only).
 */
const SIDE_MENU_CHEVRON_STYLE = {
  maxWidth: "calc(var(--sm-label-opacity, 1) * 18px)",
} as const;
/**
 * Selector row label (org/project/env): opacity follows --sm-label-opacity to fade both directions
 * without popping in on drag-open. The generous max-width cap fades the text in place rather than
 * truncating it, but still scales to 0 so an invisible label never holds width and clips the icon.
 */
const SIDE_MENU_SELECTOR_LABEL_STYLE = {
  maxWidth: "calc(var(--sm-label-opacity, 1) * 1000px)",
  opacity: "var(--sm-label-opacity, 1)",
} as const;

type SideMenuUser = Pick<
  UserWithDashboardPreferences,
  "email" | "admin" | "dashboardPreferences"
> & {
  isImpersonating: boolean;
};
export type SideMenuProject = Pick<
  MatchedProject,
  "id" | "name" | "slug" | "version" | "environments" | "engine" | "createdAt"
>;
export type SideMenuEnvironment = MatchedEnvironment;

type SideMenuProps = {
  user: SideMenuUser;
  project: SideMenuProject;
  environment: SideMenuEnvironment;
  organization: MatchedOrganization;
  organizations: MatchedOrganization[];
  button?: ReactNode;
  defaultValue?: FeedbackType;
};

export function SideMenu({
  user,
  project,
  environment,
  organization,
  organizations,
}: SideMenuProps) {
  const layout = useSideMenuLayout(user);
  const {
    isCollapsed,
    isDragging,
    isAnimating,
    dragStartedCollapsed,
    handleToggleCollapsed,
    persistSideMenuPreferences,
  } = layout;
  const currentPlan = useCurrentPlan();
  const { isConnected } = useDevPresence();
  const isFreeUser = currentPlan?.v3Subscription?.isPaying === false;
  const isAdmin = useHasAdminAccess();
  const isViewingAsUser = useIsViewingAsUser();
  const { isManagedCloud } = useFeatures();
  const featureFlags = useFeatureFlags();
  const incidentStatus = useIncidentStatus();
  const isV3Project = project.engine === "V1";
  const favorites = useFavorites();
  const [isCustomizeOpen, setCustomizeOpen] = useState(false);
  // Lives here (not in the dialog): the dialog unmounts on close, which would abort a fetcher it
  // owned mid-request.
  const customizationFetcher = useFetcher<{ success: boolean }>();
  const revalidator = useRevalidator();
  // Confirm lifecycle: the dialog stays open (Confirm spinning) until the save response AND the
  // revalidated preferences land, so the side menu is already updated the moment it closes — and
  // a failed or hung save shows as such instead of silently reading as success.
  const [isCustomizeConfirmPending, setCustomizeConfirmPending] = useState(false);
  const [customizeError, setCustomizeError] = useState<string>();
  // The fetcher's data survives across confirms, so only settle once THIS submission has been
  // seen in flight — otherwise a reopened dialog could consume the previous confirm's response.
  const customizeSubmitSeenRef = useRef(false);
  const submitSidebarCustomization = (payload: SidebarCustomizationPayload) => {
    setCustomizeError(undefined);
    setCustomizeConfirmPending(true);
    customizeSubmitSeenRef.current = false;
    customizationFetcher.submit(
      { customization: JSON.stringify(payload) },
      { method: "POST", action: "/resources/preferences/sidemenu" }
    );
  };
  useEffect(() => {
    if (!isCustomizeConfirmPending) return;
    if (customizationFetcher.state !== "idle") {
      customizeSubmitSeenRef.current = true;
      return;
    }
    if (!customizeSubmitSeenRef.current) return; // submit hasn't been picked up yet
    const data = customizationFetcher.data;
    if (!data) {
      // Settled with no response body (e.g. a session-expiry redirect): fail rather than spin
      // oxlint-disable-next-line react/set-state-in-effect -- This effect intentionally synchronizes local state after an external or lifecycle change.
      setCustomizeConfirmPending(false);
      setCustomizeError("Couldn't save your changes. Please try again.");
      return;
    }
    if (data.success) {
      // Wait out the post-save revalidation so the menu behind the dialog reflects the changes
      if (revalidator.state !== "idle") return;
      setCustomizeConfirmPending(false);
      setCustomizeOpen(false);
    } else {
      setCustomizeConfirmPending(false);
      setCustomizeError("Couldn't save your changes. Please try again.");
    }
  }, [
    isCustomizeConfirmPending,
    customizationFetcher.state,
    customizationFetcher.data,
    revalidator.state,
  ]);
  // Same ownership rule: removing a favorite optimistically unmounts its menu item (and, for the
  // last favorite, the whole section), which would abort an item-owned fetcher mid-request.
  // Separate fetchers per mutation: fetchers are single-flight, so a shared one would cancel an
  // in-flight rename when a remove follows quickly (or vice versa).
  const removeFavoriteFetcher = useFetcher();
  const renameFavoriteFetcher = useFetcher();
  const removeFavorite = (id: string) => {
    removeFavoriteFetcher.submit(
      { intent: "remove", id },
      { method: "POST", action: FAVORITES_ACTION_PATH }
    );
  };
  const renameFavorite = (id: string, label: string) => {
    renameFavoriteFetcher.submit(
      { intent: "rename", id, label },
      { method: "POST", action: FAVORITES_ACTION_PATH }
    );
  };

  /** Generic handler for any collapsible section - just pass the section ID */
  const handleSectionToggle = useCallback(
    (sectionId: SideMenuSectionId) => (collapsed: boolean) => {
      persistSideMenuPreferences({ sectionId, sectionCollapsed: collapsed });
    },
    [persistSideMenuPreferences]
  );

  // Free-plan banner slide (see FreePlanBanner). "tracking" = a close in progress, so the banner
  // follows --sm-collapse down and is gone by the halfway point; "hidden" = collapsed or an open in
  // progress (stays off-screen); "shown" = settled open, so it rises back up. Drag and click/⌘B share
  // this: a click drives --sm-collapse through the same animation, with isAnimating standing in for
  // isDragging and isCollapsed giving the direction.
  const bannerPhase: "shown" | "tracking" | "hidden" = isDragging
    ? dragStartedCollapsed
      ? "hidden"
      : "tracking"
    : isAnimating
      ? isCollapsed
        ? "tracking"
        : "hidden"
      : isCollapsed
        ? "hidden"
        : "shown";

  // The customizable sections (everything except Tasks/Runs/Sessions), in DEFAULT order. The
  // user's saved order/hidden preferences are applied at render below.
  const staticSections = buildSideMenuSections({
    organization,
    project,
    environment,
    isAdmin,
    featureFlags,
    isManagedCloud,
    dashboards: {
      action: (
        <CreateDashboardButton
          organization={organization}
          project={project}
          environment={environment}
          isCollapsed={isCollapsed}
        />
      ),
      after: (
        <DashboardList
          organization={organization}
          project={project}
          environment={environment}
          isCollapsed={isCollapsed}
          user={user}
        />
      ),
    },
  });

  const sideMenuPrefs = user.dashboardPreferences.sideMenu;

  // Section order: favorites lives above AI by default; the saved preference reorders
  const orderedSectionIds = orderByPreference(
    [{ id: "favorites" as SideMenuSectionId }, ...staticSections.map((s) => ({ id: s.id }))],
    sideMenuPrefs?.sectionOrder
  ).map((s) => s.id);

  // What the "Customize sidebar" modal edits, in default order (Tasks/Runs/Sessions excluded)
  const customizeSections: CustomizeSidebarSection[] = [
    ...(favorites.length > 0
      ? [
          {
            id: "favorites",
            title: "Favorites",
            items: favorites.map((favorite) => ({
              id: favorite.id,
              name: favorite.label,
              icon: favoritePageIcon(favorite.icon),
              iconClassName: favoritePageIconClassName(favorite.icon),
              isFavorite: true,
            })),
          },
        ]
      : []),
    ...staticSections.map((section) => ({
      id: section.id,
      title: section.title,
      items: section.items.map((item) => ({
        id: item.id,
        name: item.name,
        icon: item.icon,
        defaultHidden: item.defaultHidden,
      })),
    })),
  ];

  // Customizing exists to persist a layout, and preference writes are skipped for impersonated
  // sessions, so don't offer the entry points there at all (same reason the favorite star hides).
  const openCustomize = user.isImpersonating ? undefined : () => setCustomizeOpen(true);
  const sectionHeaderMenu = openCustomize ? (
    <SectionHeaderMenu onCustomize={openCustomize} />
  ) : undefined;

  return (
    <SideMenuShell
      layout={layout}
      className={user.isImpersonating && !isViewingAsUser ? IMPERSONATION_ACCENT.border : undefined}
    >
      <div className="absolute inset-0 grid grid-cols-[100%] grid-rows-[3rem_auto_1fr_auto] overflow-hidden">
        <div className="flex min-w-0 items-center overflow-hidden border-b border-transparent px-1 py-1">
          <div className={cn("min-w-0", (isDragging || !isCollapsed) && "flex-1")}>
            <OrgSelector
              organizations={organizations}
              organization={organization}
              isCollapsed={isCollapsed}
              isDragging={isDragging}
              isAdmin={isAdmin}
              isImpersonating={user.isImpersonating}
            />
          </div>
          <CollapsibleElement isDragging={isDragging}>
            <AccountMenu isAdmin={isAdmin} isImpersonating={user.isImpersonating} />
          </CollapsibleElement>
        </div>
        <div
          className="border-b border-grid-bright py-1"
          style={{ paddingLeft: SIDE_MENU_PAD_X, paddingRight: SIDE_MENU_PAD_X }}
        >
          <div className="w-full space-y-1">
            <SideMenuHeader title={"Project"} isCollapsed={isCollapsed} collapsedTitle="Proj" />
            <div>
              <ProjectSelector
                organization={organization}
                project={project}
                environment={environment}
                isCollapsed={isCollapsed}
                isDragging={isDragging}
                className="w-full"
              />
              <div className="flex items-center">
                <EnvironmentSelector
                  organization={organization}
                  project={project}
                  environment={environment}
                  isCollapsed={isCollapsed}
                  isDragging={isDragging}
                  className="min-w-0 flex-1"
                />
                {environment.type === "DEVELOPMENT" && (
                  <CollapsibleElement isDragging={isDragging} className="shrink-0">
                    <Dialog>
                      <TooltipProvider disableHoverableContent={true}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="inline-flex">
                              <DialogTrigger asChild>
                                <Button
                                  variant="minimal/small"
                                  className="aspect-square h-8 pl-1.5 pr-2"
                                  aria-label={
                                    isConnected === undefined
                                      ? "Dev server connection status"
                                      : isConnected
                                        ? "Dev server connected"
                                        : "Dev server not connected"
                                  }
                                  LeadingIcon={
                                    <ConnectionIcon
                                      isConnected={isConnected}
                                      className="size-4.5"
                                    />
                                  }
                                />
                              </DialogTrigger>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className={"text-xs"}>
                            {isConnected === undefined
                              ? "Checking connection…"
                              : isConnected
                                ? "Your dev server is connected"
                                : "Your dev server is not connected"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <DevPresencePanel isConnected={isConnected} />
                    </Dialog>
                  </CollapsibleElement>
                )}
              </div>
            </div>
          </div>
        </div>
        <SideMenuScroll layout={layout}>
          <div className="w-full space-y-0">
            <SideMenuItem
              name="Tasks"
              icon={TasksIcon}
              activeIconColor="text-tasks"
              inactiveIconColor="text-text-dimmed"
              to={v3EnvironmentPath(organization, project, environment)}
              data-action="tasks"
              isCollapsed={isCollapsed}
              yieldActiveToFavorite
            />
            <SideMenuItem
              name="Runs"
              icon={RunsIcon}
              activeIconColor="text-runs"
              inactiveIconColor="text-text-dimmed"
              to={v3RunsPath(organization, project, environment)}
              data-action="runs"
              isCollapsed={isCollapsed}
              yieldActiveToFavorite
            />
            <SideMenuItem
              name="Sessions"
              icon={AIChatIcon}
              activeIconColor="text-sessions"
              inactiveIconColor="text-text-dimmed"
              to={v3SessionsPath(organization, project, environment)}
              data-action="sessions"
              badge={<NewBadge variant="text" className="text-xs leading-none" />}
              isCollapsed={isCollapsed}
              yieldActiveToFavorite
            />
            {(user.admin || user.isImpersonating || featureFlags.hasWebhooksAccess) && (
              <SideMenuItem
                name="Webhooks"
                icon={WebhookIcon}
                activeIconColor="text-webhooks"
                inactiveIconColor="text-text-dimmed"
                to={v3WebhooksPath(organization, project, environment)}
                data-action="webhooks"
                badge={<NewBadge variant="text" className="text-xs leading-none" />}
                isCollapsed={isCollapsed}
                yieldActiveToFavorite
              />
            )}
          </div>

          {orderedSectionIds.map((sectionId) => {
            if (sectionId === "favorites") {
              if (favorites.length === 0) return null;
              return (
                <FavoritesSideMenuSection
                  key="favorites"
                  favorites={favorites}
                  hiddenItems={sideMenuPrefs?.hiddenItems}
                  isCollapsed={isCollapsed}
                  initialCollapsed={getSectionCollapsed(sideMenuPrefs, "favorites")}
                  onCollapseToggle={handleSectionToggle("favorites")}
                  headerMenu={sectionHeaderMenu}
                  onCustomize={openCustomize}
                  onRemoveFavorite={removeFavorite}
                  onRenameFavorite={renameFavorite}
                />
              );
            }

            const section = staticSections.find((s) => s.id === sectionId);
            if (!section) return null;

            return (
              <CustomizableSideMenuSection
                key={section.id}
                section={section}
                itemOrder={sideMenuPrefs?.sectionItemOrder?.[section.id]}
                hiddenItems={sideMenuPrefs?.hiddenItems}
                isCollapsed={isCollapsed}
                initialCollapsed={getSectionCollapsed(sideMenuPrefs, section.id)}
                onCollapseToggle={handleSectionToggle(section.id)}
                headerMenu={sectionHeaderMenu}
                onCustomize={openCustomize}
              />
            );
          })}
        </SideMenuScroll>
        <div>
          <NotificationPanel
            isCollapsed={isCollapsed}
            hasIncident={incidentStatus.hasIncident}
            organizationId={organization.id}
            projectId={project.id}
          />
          <IncidentStatusPanel
            isCollapsed={isCollapsed}
            title={incidentStatus.title}
            hasIncident={incidentStatus.hasIncident}
            isManagedCloud={incidentStatus.isManagedCloud}
          />
          <V3DeprecationPanel
            isCollapsed={isCollapsed}
            isV3={isV3Project}
            projectCreatedAt={project.createdAt}
            hasIncident={incidentStatus.hasIncident}
            isManagedCloud={incidentStatus.isManagedCloud}
          />
          <motion.div
            layout
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={cn(
              "flex flex-col gap-1 border-t border-grid-bright p-1",
              isCollapsed && "items-center"
            )}
          >
            <SideMenuFooterControls
              isCollapsed={isCollapsed}
              isDragging={isDragging}
              organizationId={organization.id}
              projectId={project.id}
              onToggleCollapsed={handleToggleCollapsed}
            />
            {isFreeUser && (
              <FreePlanBanner
                to={v3BillingPath(organization)}
                percentage={currentPlan.v3Usage.usagePercentage}
                phase={bannerPhase}
              />
            )}
          </motion.div>
        </div>
      </div>
      <Dialog
        open={isCustomizeOpen}
        onOpenChange={(open) => {
          setCustomizeOpen(open);
          if (!open) {
            // Cancel/ESC during a pending confirm abandons the wait; a still-running save is
            // harmless (the menu revalidates whenever it lands)
            setCustomizeConfirmPending(false);
            setCustomizeError(undefined);
          }
        }}
      >
        {/* Mounted only while open so the modal state re-seeds from current preferences each time */}
        {isCustomizeOpen && (
          <CustomizeSidebarDialog
            sections={customizeSections}
            prefs={{
              sectionOrder: sideMenuPrefs?.sectionOrder,
              hiddenItems: sideMenuPrefs?.hiddenItems,
              sectionItemOrder: sideMenuPrefs?.sectionItemOrder,
            }}
            onConfirm={submitSidebarCustomization}
            isConfirming={isCustomizeConfirmPending}
            confirmError={customizeError}
          />
        )}
      </Dialog>
    </SideMenuShell>
  );
}

/** A section built from {@link SideMenuItemConfig}s with the user's order/hidden prefs applied. */
function CustomizableSideMenuSection({
  section,
  itemOrder,
  hiddenItems,
  isCollapsed,
  initialCollapsed,
  onCollapseToggle,
  headerMenu,
  onCustomize,
}: {
  section: SideMenuSectionConfig;
  itemOrder: string[] | undefined;
  hiddenItems: Record<string, boolean> | undefined;
  isCollapsed: boolean;
  initialCollapsed: boolean;
  onCollapseToggle: (collapsed: boolean) => void;
  headerMenu: ReactNode;
  /** Undefined when customizing isn't offered (impersonated sessions can't persist a layout). */
  onCustomize: (() => void) | undefined;
}) {
  const orderedItems = orderByPreference(section.items, itemOrder);
  const visibleItems = orderedItems.filter((item) => !isItemHidden(item, hiddenItems));
  const moreItems = orderedItems.filter((item) => isItemHidden(item, hiddenItems));

  return (
    <SideMenuSection
      title={section.title}
      isSideMenuCollapsed={isCollapsed}
      itemSpacingClassName="space-y-0"
      initialCollapsed={initialCollapsed}
      onCollapseToggle={onCollapseToggle}
      headerMenu={headerMenu}
    >
      {visibleItems.map((item) => (
        <Fragment key={item.id}>
          <SideMenuItem
            name={item.name}
            icon={item.icon}
            trailingIconClassName={item.trailingIconClassName}
            activeIconColor={item.activeIconColor}
            inactiveIconColor={item.inactiveIconColor ?? "text-text-dimmed"}
            to={item.to}
            data-action={item.dataAction}
            badge={item.badge}
            isCollapsed={isCollapsed}
            action={item.action}
            yieldActiveToFavorite
          />
          {item.after}
        </Fragment>
      ))}
      {moreItems.length > 0 && (
        <SideMenuMoreItem
          items={moreItems.map((item) => ({
            id: item.id,
            name: item.name,
            icon: item.icon,
            to: item.to,
          }))}
          isCollapsed={isCollapsed}
          onCustomize={onCustomize}
        />
      )}
    </SideMenuSection>
  );
}

/** The user's favorited pages; hidden favorites collapse into the trailing "More" item. */
function FavoritesSideMenuSection({
  favorites,
  hiddenItems,
  isCollapsed,
  initialCollapsed,
  onCollapseToggle,
  headerMenu,
  onCustomize,
  onRemoveFavorite,
  onRenameFavorite,
}: {
  favorites: FavoritePage[];
  hiddenItems: Record<string, boolean> | undefined;
  isCollapsed: boolean;
  initialCollapsed: boolean;
  onCollapseToggle: (collapsed: boolean) => void;
  headerMenu: ReactNode;
  /** Undefined when customizing isn't offered (impersonated sessions can't persist a layout). */
  onCustomize: (() => void) | undefined;
  onRemoveFavorite: (id: string) => void;
  onRenameFavorite: (id: string, label: string) => void;
}) {
  const visible = favorites.filter((favorite) => !(hiddenItems?.[favorite.id] ?? false));
  const hidden = favorites.filter((favorite) => hiddenItems?.[favorite.id] ?? false);

  return (
    <SideMenuSection
      title="Favorites"
      isSideMenuCollapsed={isCollapsed}
      itemSpacingClassName="space-y-0"
      initialCollapsed={initialCollapsed}
      onCollapseToggle={onCollapseToggle}
      headerMenu={headerMenu}
    >
      {visible.map((favorite) => (
        <FavoriteMenuItem
          key={favorite.id}
          favorite={favorite}
          isCollapsed={isCollapsed}
          onRemove={onRemoveFavorite}
          onRename={onRenameFavorite}
        />
      ))}
      {hidden.length > 0 && (
        <SideMenuMoreItem
          items={hidden.map((favorite) => ({
            id: favorite.id,
            name: favorite.label,
            icon: favoritePageIcon(favorite.icon),
            iconClassName: favoritePageIconClassName(favorite.icon),
            to: favoriteLinkTo(favorite),
          }))}
          isCollapsed={isCollapsed}
          onCustomize={onCustomize}
        />
      )}
    </SideMenuSection>
  );
}

/**
 * The trailing "More" item of a section: a popover listing that section's hidden items. Only
 * rendered when the section has hidden items.
 */
function SideMenuMoreItem({
  items,
  isCollapsed,
  onCustomize,
}: {
  items: Array<{ id: string; name: string; icon: RenderIcon; iconClassName?: string; to: string }>;
  isCollapsed: boolean;
  /** Undefined when customizing isn't offered (impersonated sessions can't persist a layout). */
  onCustomize: (() => void) | undefined;
}) {
  const [isOpen, setOpen] = useState(false);
  const navigation = useNavigation();

  // Watch search too: navigating to a favorite can change only the search on the same pathname
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- This effect intentionally synchronizes local state after an external or lifecycle change.
    setOpen(false);
  }, [navigation.location?.pathname, navigation.location?.search]);

  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
      <SimpleTooltip
        button={
          <PopoverTrigger className="flex h-8 w-full items-center gap-2 overflow-hidden rounded pl-2 pr-2 text-text-dimmed hover:bg-background-hover hover:text-text-bright focus-custom data-[state=open]:bg-background-hover data-[state=open]:text-text-bright">
            <EllipsisHorizontalIcon className="size-4.5 shrink-0" />
            <SideMenuLabel
              className="min-w-0 flex-1 select-none text-left text-[0.90625rem] font-medium tracking-[-0.01em]"
              style={{ opacity: "var(--sm-label-opacity, 1)" }}
            >
              More
            </SideMenuLabel>
          </PopoverTrigger>
        }
        content="More"
        side="right"
        sideOffset={8}
        hidden={!isCollapsed}
        asChild
        tabbable
        disableHoverableContent
      />
      <PopoverContent className="min-w-44 p-0" side="right" align="start" sideOffset={4}>
        <div className="flex flex-col gap-1 p-1">
          {items.map((item) => (
            <PopoverMenuItem
              key={item.id}
              to={item.to}
              title={item.name}
              icon={item.icon}
              leadingIconClassName={cn(SIDE_MENU_POPOVER_ITEM_ICON, item.iconClassName)}
              className={SIDE_MENU_POPOVER_ITEM_LABEL}
            />
          ))}
        </div>
        {/* flex-col blockifies the inline-block menu item, avoiding stray line-box space below */}
        {onCustomize && (
          <div className="flex flex-col border-t border-grid-bright p-1">
            <PopoverMenuItem
              icon={SidebarCustomizeIcon}
              title="Customize sidebar"
              leadingIconClassName={SIDE_MENU_POPOVER_ITEM_ICON}
              className={SIDE_MENU_POPOVER_ITEM_LABEL}
              onClick={() => {
                setOpen(false);
                onCustomize();
              }}
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** The ellipsis on section headers (visible on hover) opening the sidebar customization menu. */
function SectionHeaderMenu({ onCustomize }: { onCustomize: () => void }) {
  const [isOpen, setOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
      <PopoverCustomTrigger
        aria-label="Sidebar options"
        className="flex size-4.5 items-center justify-center justify-items-center rounded p-0 text-text-dimmed hover:bg-surface-control hover:text-text-bright"
      >
        <EllipsisHorizontalIcon className="size-4.5" />
      </PopoverCustomTrigger>
      <PopoverContent className="w-fit min-w-max p-0" align="start" sideOffset={4}>
        {/* flex-col blockifies the inline-block menu item, avoiding stray line-box space below */}
        <div className="flex flex-col p-1">
          <PopoverMenuItem
            icon={SidebarCustomizeIcon}
            title="Customize sidebar"
            leadingIconClassName={SIDE_MENU_POPOVER_ITEM_ICON}
            className={SIDE_MENU_POPOVER_ITEM_LABEL}
            onClick={() => {
              setOpen(false);
              onCustomize();
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function V3DeprecationPanel({
  isCollapsed,
  isV3,
  projectCreatedAt,
  hasIncident,
  isManagedCloud,
}: {
  isCollapsed: boolean;
  isV3: boolean;
  projectCreatedAt: Date;
  hasIncident: boolean;
  isManagedCloud: boolean;
}) {
  // Only show for projects created before v4 was released
  const V4_RELEASE_DATE = new Date("2025-09-01");
  const isLikelyV3 = isV3 && new Date(projectCreatedAt) < V4_RELEASE_DATE;

  if (!isManagedCloud || !isLikelyV3 || hasIncident) {
    return null;
  }

  return (
    <Popover>
      <div className="p-1">
        <motion.div
          initial={false}
          animate={{
            height: isCollapsed ? 0 : "auto",
            opacity: isCollapsed ? 0 : 1,
          }}
          transition={{ duration: 0.15 }}
          className="overflow-hidden"
        >
          <V3DeprecationContent />
        </motion.div>

        <motion.div
          initial={false}
          animate={{
            height: isCollapsed ? "auto" : 0,
            opacity: isCollapsed ? 1 : 0,
          }}
          transition={{ duration: 0.15 }}
          className="overflow-hidden"
        >
          <SimpleTooltip
            button={
              <PopoverTrigger className="flex h-8! w-full items-center justify-center rounded border border-amber-500/30 bg-amber-500/15 transition-colors hover:border-amber-500/50 hover:bg-amber-500/25">
                <ExclamationTriangleIcon className="size-4.5 text-amber-400" />
              </PopoverTrigger>
            }
            content="v3 is now deprecated"
            side="right"
            sideOffset={8}
            disableHoverableContent
            asChild
          />
        </motion.div>
      </div>
      <PopoverContent side="right" sideOffset={8} align="start" className="w-52 min-w-0! p-0">
        <V3DeprecationContent />
      </PopoverContent>
    </Popover>
  );
}

function V3DeprecationContent() {
  return (
    <div className="flex flex-col gap-2 rounded border border-amber-500/30 bg-amber-500/10 p-2 pt-1.5">
      <div className="flex items-center gap-1 border-b border-amber-500/30 pb-1">
        <ExclamationTriangleIcon className="size-4.5 text-amber-400" />
        <Paragraph variant="small/bright" className="text-amber-300">
          v3 is now deprecated
        </Paragraph>
      </div>
      <Paragraph variant="extra-small/bright" className="text-amber-300">
        This is a v3 project which is now deprecated so no runs are executing. Upgrade to v4 to
        resume executing runs in this project.
      </Paragraph>
      <LinkButton
        variant="secondary/small"
        to={docsPath("/upgrade-to-v4")}
        target="_blank"
        fullWidth
        TrailingIcon={ArrowTopRightOnSquareIcon}
        trailingIconClassName="text-amber-300"
        className="border-amber-500/30 bg-amber-500/15 hover:border-amber-500/50! hover:bg-amber-500/25!"
      >
        <span className="text-amber-300">Upgrade to v4</span>
      </LinkButton>
    </div>
  );
}

function OrgSelector({
  organization,
  organizations,
  isCollapsed = false,
  isDragging = false,
  isAdmin,
  isImpersonating,
}: {
  organization: MatchedOrganization;
  organizations: MatchedOrganization[];
  isCollapsed?: boolean;
  /** True while the menu is being drag-resized; keeps the row in its expanded arrangement. */
  isDragging?: boolean;
  /** Account context, only used to render the collapsed-rail "Account" submenu (see below). */
  isAdmin: boolean;
  isImpersonating: boolean;
}) {
  const currentPlan = useCurrentPlan();
  const [isOrgMenuOpen, setOrgMenuOpen] = useState(false);
  const navigation = useNavigation();
  const { isManagedCloud } = useFeatures();
  const featureFlags = useFeatureFlags();
  const showSelfServe = useShowSelfServe();
  const isUsingRbacPlugin = useIsUsingRbacPlugin();
  const isUsingSsoPlugin = useIsUsingSsoPlugin();

  const isPaying = currentPlan?.v3Subscription?.isPaying === true;
  const planTitle = currentPlan?.v3Subscription?.plan?.title;

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- This effect intentionally synchronizes local state after an external or lifecycle change.
    setOrgMenuOpen(false);
  }, [navigation.location?.pathname]);

  return (
    <Popover onOpenChange={(open) => setOrgMenuOpen(open)} open={isOrgMenuOpen}>
      <SimpleTooltip
        button={
          <PopoverTrigger
            className={cn(
              "group flex h-8 items-center rounded pl-2 hover:bg-background-hover focus-custom",
              // Expanded arrangement also applies mid-drag (resting classes flip only on release).
              isDragging || !isCollapsed ? "w-full justify-between pr-1" : "justify-center pr-0.5"
            )}
          >
            <span className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
              <Avatar
                avatar={organization.avatar}
                size={1.125}
                letterSize={0.75}
                orgName={organization.title}
              />
              <span
                className="flex min-w-0 items-center gap-1.5 overflow-hidden"
                style={SIDE_MENU_SELECTOR_LABEL_STYLE}
              >
                <SideMenuLabel className="text-[0.90625rem] font-medium tracking-[-0.01em] text-text-bright">
                  {organization.title}
                </SideMenuLabel>
              </span>
            </span>
            <span
              className="overflow-hidden opacity-0 group-hover:opacity-100"
              style={SIDE_MENU_CHEVRON_STYLE}
            >
              <DropdownIcon className="size-4.5 min-w-4.5 text-text-dimmed group-hover:text-text-bright" />
            </span>
          </PopoverTrigger>
        }
        content={organization.title}
        side="right"
        sideOffset={8}
        hidden={!isCollapsed}
        buttonClassName="h-8!"
        asChild
        tabbable
        disableHoverableContent
      />
      <PopoverContent
        className="min-w-64 overflow-y-auto p-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-surface-control"
        side={isCollapsed ? "right" : "bottom"}
        sideOffset={isCollapsed ? 8 : 4}
        align="start"
        style={{ maxHeight: `calc(var(--radix-popover-content-available-height) - 10vh)` }}
      >
        {!isCollapsed && <PopoverSectionHeader title="Organization" />}
        <div className="flex flex-col gap-1 p-1">
          <PopoverMenuItem
            to={organizationSettingsPath(organization)}
            title="Settings"
            icon={SlidersIcon}
            leadingIconClassName={SIDE_MENU_POPOVER_ITEM_ICON}
            className={SIDE_MENU_POPOVER_ITEM_LABEL}
          />
          {isManagedCloud && (
            <PopoverMenuItem
              to={v3UsagePath(organization)}
              title="Usage"
              icon={UsageIcon}
              leadingIconClassName={SIDE_MENU_POPOVER_ITEM_ICON}
              className={SIDE_MENU_POPOVER_ITEM_LABEL}
            />
          )}
          {isManagedCloud && (
            <PopoverMenuItem
              to={v3BillingPath(organization)}
              title={
                <div className="flex w-full items-center justify-between text-text-bright">
                  <span className="grow truncate text-left">Billing</span>
                  {isPaying && planTitle ? <Badge variant="extra-small">{planTitle}</Badge> : null}
                </div>
              }
              icon={CreditCardIcon}
              leadingIconClassName={SIDE_MENU_POPOVER_ITEM_ICON}
              className={SIDE_MENU_POPOVER_ITEM_LABEL}
            />
          )}
          {isManagedCloud && showSelfServe && (
            <PopoverMenuItem
              to={v3BillingLimitsPath(organization)}
              title="Billing alerts"
              icon={BellIcon}
              leadingIconClassName={SIDE_MENU_POPOVER_ITEM_ICON}
              className={SIDE_MENU_POPOVER_ITEM_LABEL}
            />
          )}
          <PopoverMenuItem
            to={organizationTeamPath(organization)}
            title="Team"
            icon={UserGroupIcon}
            leadingIconClassName={SIDE_MENU_POPOVER_ITEM_ICON}
            className={SIDE_MENU_POPOVER_ITEM_LABEL}
          />
          {featureFlags.hasPrivateConnections && (
            <PopoverMenuItem
              to={v3PrivateConnectionsPath(organization)}
              title="Private connections"
              icon={ChainLinkIcon}
              leadingIconClassName={SIDE_MENU_POPOVER_ITEM_ICON}
              className={SIDE_MENU_POPOVER_ITEM_LABEL}
            />
          )}
          {isUsingRbacPlugin && (
            <PopoverMenuItem
              to={organizationRolesPath(organization)}
              title="Roles"
              icon={RolesIcon}
              leadingIconClassName={SIDE_MENU_POPOVER_ITEM_ICON}
              className={SIDE_MENU_POPOVER_ITEM_LABEL}
            />
          )}
          {isUsingSsoPlugin && (
            <PopoverMenuItem
              to={organizationSsoPath(organization)}
              title="SSO"
              icon={PadlockIcon}
              leadingIconClassName={SIDE_MENU_POPOVER_ITEM_ICON}
              className={SIDE_MENU_POPOVER_ITEM_LABEL}
            />
          )}
          <Integrations organization={organization} />
        </div>
        <div className="border-t border-grid-bright p-1">
          {isImpersonating ? (
            <SimpleTooltip
              asChild
              side="right"
              content="Not available in a Support Access session"
              button={
                <div>
                  <PopoverMenuItem
                    title="Switch organization"
                    icon={ArrowLeftRightIcon}
                    leadingIconClassName={SIDE_MENU_POPOVER_ITEM_ICON}
                    className={cn(SIDE_MENU_POPOVER_ITEM_LABEL, "cursor-not-allowed opacity-50!")}
                    disabled
                  />
                </div>
              }
            />
          ) : organizations.length > 1 ? (
            <SwitchOrganizations organizations={organizations} organization={organization} />
          ) : (
            <PopoverMenuItem
              to={newOrganizationPath()}
              title="New organization"
              icon={PlusIcon}
              leadingIconClassName={SIDE_MENU_POPOVER_ITEM_ICON}
              className={SIDE_MENU_POPOVER_ITEM_LABEL}
            />
          )}
        </div>
        {/* Collapsed: the account button is hidden, so surface Account as a submenu here (the only
            always-reachable menu on the rail). */}
        {isCollapsed && (
          <div className="border-t border-grid-bright p-1">
            <SideMenuPopoverSubMenu
              title="Account"
              icon={<UserProfilePhoto className="size-4.5" />}
            >
              <AccountMenuItems isAdmin={isAdmin} isImpersonating={isImpersonating} />
            </SideMenuPopoverSubMenu>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/**
 * Account menu entries, shared by the standalone account popover (expanded rail) and the "Account"
 * submenu in the org popover (collapsed rail).
 */
function AccountMenuItems({
  isAdmin,
  isImpersonating,
}: {
  isAdmin: boolean;
  isImpersonating: boolean;
}) {
  const submit = useSubmit();
  const stopImpersonating = () =>
    submit(null, { action: "/resources/impersonation", method: "delete" });

  return (
    <>
      {/* "Exit Support Access" and the view-as-user toggle key off raw impersonation, not `isAdmin`:
          with "view as user" on, `isAdmin` is false and these are the only ways back out. */}
      {(isImpersonating || isAdmin) && (
        <div className="flex flex-col gap-1 border-b border-grid-bright p-1">
          {isImpersonating ? (
            <>
              <PopoverMenuItem
                title={
                  <div className="flex w-full items-center justify-between">
                    <span className={IMPERSONATION_ACCENT.text}>Exit Support Access</span>
                    <ShortcutKey
                      shortcut={{ modifiers: ["mod", "alt"], key: "a" }}
                      variant="medium/bright"
                    />
                  </div>
                }
                icon={UserCrossIcon}
                onClick={stopImpersonating}
                leadingIconClassName={cn(SIDE_MENU_POPOVER_ITEM_ICON, IMPERSONATION_ACCENT.text)}
                className={SIDE_MENU_POPOVER_ITEM_LABEL}
              />
              <ViewAsUserMenuItem />
            </>
          ) : (
            <PopoverMenuItem
              to={adminPath()}
              title={
                <div className="flex w-full items-center justify-between">
                  <span>Admin dashboard</span>
                  <ShortcutKey
                    shortcut={{ modifiers: ["mod", "alt"], key: "a" }}
                    variant="medium/bright"
                  />
                </div>
              }
              icon={HomeIcon}
              leadingIconClassName={SIDE_MENU_POPOVER_ITEM_ICON}
              className={SIDE_MENU_POPOVER_ITEM_LABEL}
            />
          )}
        </div>
      )}
      <div className="flex flex-col gap-1 p-1">
        <PopoverMenuItem
          to={accountPath()}
          title="Profile"
          icon={AvatarCircleIcon}
          leadingIconClassName={SIDE_MENU_POPOVER_ITEM_ICON}
          className={SIDE_MENU_POPOVER_ITEM_LABEL}
        />
        <AppearanceMenuItem />
        <PopoverMenuItem
          to={personalAccessTokensPath()}
          title="Personal Access Tokens"
          icon={ShieldIcon}
          leadingIconClassName={SIDE_MENU_POPOVER_ITEM_ICON}
          className={SIDE_MENU_POPOVER_ITEM_LABEL}
        />
        <PopoverMenuItem
          to={accountSecurityPath()}
          title="Security"
          icon={PadlockIcon}
          leadingIconClassName={SIDE_MENU_POPOVER_ITEM_ICON}
          className={SIDE_MENU_POPOVER_ITEM_LABEL}
        />
      </div>
      <div className="border-t border-grid-bright p-1">
        <PopoverMenuItem
          to={logoutPath()}
          title="Logout"
          icon={ArrowRightSquareIcon}
          leadingIconClassName={SIDE_MENU_POPOVER_ITEM_ICON}
          className={SIDE_MENU_POPOVER_ITEM_LABEL}
          danger
        />
      </div>
    </>
  );
}

/**
 * Toggles the display-only "view as user" mode for the current impersonation session, so an admin
 * can see the dashboard the way the impersonated user sees it. `reloadDocument` forces a full
 * navigation, so every loader re-runs under the updated cookie instead of reusing cached data.
 */
function ViewAsUserMenuItem() {
  const isViewingAsUser = useIsViewingAsUser();
  const location = useLocation();

  return (
    <Form method="post" action="/resources/impersonation/view-as" reloadDocument>
      <input type="hidden" name="viewAsUser" value={isViewingAsUser ? "false" : "true"} />
      <input type="hidden" name="redirectTo" value={`${location.pathname}${location.search}`} />
      <PopoverMenuItem
        type="submit"
        title={isViewingAsUser ? "Show admin UI" : "View as user"}
        icon={isViewingAsUser ? EyeClosedIcon : EyeOpenIcon}
        leadingIconClassName={cn(SIDE_MENU_POPOVER_ITEM_ICON, IMPERSONATION_ACCENT.text)}
        className={SIDE_MENU_POPOVER_ITEM_LABEL}
      />
    </Form>
  );
}

function AccountMenu({ isAdmin, isImpersonating }: { isAdmin: boolean; isImpersonating: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- This effect intentionally synchronizes local state after an external or lifecycle change.
    setIsOpen(false);
  }, [navigation.location?.pathname]);

  // The admin shortcut lives in <GlobalShortcuts> so it works everywhere, not just where this menu is.
  return (
    <Popover onOpenChange={(open) => setIsOpen(open)} open={isOpen}>
      <SimpleTooltip
        button={
          <PopoverTrigger className="group flex size-8 items-center justify-center rounded pl-1.5 pr-2 hover:bg-background-hover focus-custom">
            <UserProfilePhoto className="size-4.5" />
          </PopoverTrigger>
        }
        content="Account"
        side="bottom"
        sideOffset={8}
        asChild
        tabbable
        disableHoverableContent
      />
      <PopoverContent
        className="min-w-64 overflow-y-auto p-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-surface-control"
        side="bottom"
        sideOffset={4}
        align="start"
        style={{ maxHeight: `calc(var(--radix-popover-content-available-height) - 10vh)` }}
      >
        <PopoverSectionHeader title="Account" />
        <AccountMenuItems isAdmin={isAdmin} isImpersonating={isImpersonating} />
      </PopoverContent>
    </Popover>
  );
}

function ProjectSelector({
  project,
  organization,
  environment,
  isCollapsed = false,
  isDragging = false,
  className,
}: {
  project: SideMenuProject;
  organization: MatchedOrganization;
  environment: SideMenuEnvironment;
  isCollapsed?: boolean;
  /** True while the menu is being drag-resized; keeps the row in its expanded arrangement. */
  isDragging?: boolean;
  className?: string;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigation = useNavigation();
  const { urlForProject } = usePageSwitcher();

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- This effect intentionally synchronizes local state after an external or lifecycle change.
    setIsMenuOpen(false);
  }, [navigation.location?.pathname]);

  return (
    <Popover onOpenChange={(open) => setIsMenuOpen(open)} open={isMenuOpen}>
      <SimpleTooltip
        button={
          <PopoverTrigger
            className={cn(
              "group flex h-8 items-center rounded pl-2 hover:bg-background-hover focus-custom",
              // Expanded arrangement also applies mid-drag (resting classes flip only on release).
              isDragging || !isCollapsed ? "justify-between pr-1" : "justify-center pr-0.5",
              className
            )}
          >
            <span className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
              <FolderOpenIcon className="size-4.5 shrink-0 text-text-bright" />
              <span
                className="flex min-w-0 items-center overflow-hidden"
                style={SIDE_MENU_SELECTOR_LABEL_STYLE}
              >
                <SideMenuLabel className="text-[0.90625rem] font-medium tracking-[-0.01em] text-text-bright">
                  {project.name ?? "Select a project"}
                </SideMenuLabel>
              </span>
            </span>
            <span
              className="overflow-hidden opacity-0 group-hover:opacity-100"
              style={SIDE_MENU_CHEVRON_STYLE}
            >
              <DropdownIcon className="size-4.5 min-w-4.5 text-text-dimmed group-hover:text-text-bright" />
            </span>
          </PopoverTrigger>
        }
        content={project.name ?? "Select a project"}
        side="right"
        sideOffset={8}
        hidden={!isCollapsed}
        buttonClassName="h-8!"
        asChild
        tabbable
        disableHoverableContent
      />
      <PopoverContent
        className="min-w-56 overflow-y-auto p-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-surface-control"
        side={isCollapsed ? "right" : "bottom"}
        sideOffset={isCollapsed ? 8 : 4}
        align="start"
        style={{ maxHeight: `calc(var(--radix-popover-content-available-height) - 10vh)` }}
      >
        <div className="flex flex-col gap-1 p-1">
          <PopoverMenuItem
            to={newProjectPath(organization)}
            title="New project"
            icon={PlusIcon}
            leadingIconClassName={SIDE_MENU_POPOVER_ITEM_ICON}
            className={SIDE_MENU_POPOVER_ITEM_LABEL}
          />
          <PopoverMenuItem
            to={v3ProjectSettingsGeneralPath(organization, project, environment)}
            title="Project settings"
            icon={SlidersIcon}
            leadingIconClassName={SIDE_MENU_POPOVER_ITEM_ICON}
            className={SIDE_MENU_POPOVER_ITEM_LABEL}
          />
        </div>
        <div className="flex flex-col gap-1 border-t border-grid-bright p-1">
          {organization.projects.map((p) => {
            const isSelected = p.id === project.id;
            return (
              <PopoverMenuItem
                key={p.id}
                to={urlForProject(organization, p)}
                title={
                  <div className="flex w-full items-center justify-between text-text-bright">
                    <SideMenuLabel className="min-w-0 grow text-left">{p.name}</SideMenuLabel>
                  </div>
                }
                isSelected={isSelected}
                icon={isSelected ? FolderOpenIcon : FolderClosedIcon}
                leadingIconClassName="h-5 w-5 text-indigo-500"
                className={SIDE_MENU_POPOVER_ITEM_LABEL}
              />
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SwitchOrganizations({
  organizations,
  organization,
}: {
  organizations: MatchedOrganization[];
  organization: MatchedOrganization;
}) {
  const { urlForOrganization } = usePageSwitcher();

  return (
    <SideMenuPopoverSubMenu title="Switch organization" icon={ArrowLeftRightIcon}>
      <div className="flex flex-col gap-1 p-1">
        <PopoverMenuItem
          to={newOrganizationPath()}
          title="New organization"
          icon={PlusIcon}
          leadingIconClassName={SIDE_MENU_POPOVER_ITEM_ICON}
          className={SIDE_MENU_POPOVER_ITEM_LABEL}
        />
      </div>
      <div className="flex flex-col gap-1 border-t border-grid-bright p-1">
        {organizations.map((org) => (
          <PopoverMenuItem
            key={org.id}
            to={urlForOrganization(org)}
            title={org.title}
            icon={<Avatar size={1.25} avatar={org.avatar} orgName={org.title} />}
            leadingIconClassName="text-text-dimmed"
            className={SIDE_MENU_POPOVER_ITEM_LABEL}
            isSelected={org.id === organization.id}
          />
        ))}
      </div>
    </SideMenuPopoverSubMenu>
  );
}

function Integrations({ organization }: { organization: MatchedOrganization }) {
  return (
    <SideMenuPopoverSubMenu title="Integrations" icon={IntegrationsIcon}>
      <div className="flex flex-col gap-1 p-1">
        <PopoverMenuItem
          to={organizationVercelIntegrationPath(organization)}
          title="Vercel"
          icon={VercelLogo}
          leadingIconClassName="size-4.5 text-text-dimmed"
          className={SIDE_MENU_POPOVER_ITEM_LABEL}
        />
        <PopoverMenuItem
          to={organizationSlackIntegrationPath(organization)}
          title="Slack"
          icon={SlackIcon}
          leadingIconClassName="size-4.5 text-text-dimmed"
          className={SIDE_MENU_POPOVER_ITEM_LABEL}
        />
      </div>
    </SideMenuPopoverSubMenu>
  );
}

/**
 * Fades out and collapses to 0 width via the menu's `--sm-label-opacity` variable, tracking a drag
 * in real time (no CSS opacity transition — it would lag the per-frame variable writes).
 */
function CollapsibleElement({
  isDragging = false,
  children,
  className,
}: {
  /** Only blocks clicks on the fading button mid-drag; the hiding is width+opacity below. */
  isDragging?: boolean;
  children: ReactNode;
  className?: string;
}) {
  // Width AND opacity follow --sm-label-opacity: opacity alone would leave the invisible button
  // holding 32px of row width, pushing the primary item's clip edge into its icon ("masked" mid-drag).
  // Shrinking width on the same curve hands that space back. No CSS transition (it would lag the writes).
  return (
    <div
      className={cn("overflow-hidden", isDragging && "pointer-events-none", className)}
      style={{
        maxWidth: "calc(var(--sm-label-opacity, 1) * 32px)",
        opacity: "var(--sm-label-opacity, 1)",
      }}
    >
      {children}
    </div>
  );
}

/**
 * The Free-plan banner at the foot of the menu. On close it doesn't collapse or slide on its own: its
 * reserved height collapses (tracking --sm-collapse, gone by the halfway point) and, because the bottom
 * section is pinned to the bottom, that pushes the whole section (Help & Feedback + this banner) down so
 * the full-height banner slides off the bottom edge. On open it lags, waiting for the settled "shown"
 * phase, then rises back up via translateY. Height is measured so the reclaimed space matches the banner.
 */
function FreePlanBanner({
  to,
  percentage,
  phase,
}: {
  to: string;
  percentage: number;
  phase: "shown" | "tracking" | "hidden";
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = () => setHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Close progress, doubled + clamped so the banner is fully gone by the time the menu is halfway shut.
  const closeProgress = "min(var(--sm-collapse, 0) * 2, 1)";
  // Slide a little past its own height to clear the section padding + the viewport edge.
  const offset = height + 24;

  const maxHeight =
    phase === "shown"
      ? height
        ? `${height}px`
        : "none"
      : phase === "hidden"
        ? "0px"
        : `calc((1 - ${closeProgress}) * ${height}px)`;
  // On close the banner no longer slides itself: its reserved height collapses (maxHeight) and, because
  // the bottom section is pinned to the bottom, that drops Help & Feedback down while the full-height
  // banner overflows off the bottom edge. Only the pop-up-from-hidden rise uses translateY, so "hidden"
  // parks it below the edge; "shown" and "tracking" both sit at 0.
  const translateY = phase === "hidden" ? `${offset}px` : "0px";
  // Fade out as it slides off (tracking --sm-collapse) and fade back in on the settled-open rise.
  const opacity = phase === "shown" ? 1 : phase === "hidden" ? 0 : `calc(1 - ${closeProgress})`;

  return (
    <div
      style={{
        maxHeight,
        // The full-height banner overflows off the bottom as maxHeight collapses; it isn't clipped.
        overflow: "visible",
        transform: `translateY(${translateY})`,
        opacity,
        // Only the settled-open rise animates; while tracking a drag/close we follow --sm-collapse
        // frame-by-frame (a transition would lag the drag).
        transition:
          phase === "shown"
            ? "max-height 300ms ease, transform 300ms ease, opacity 300ms ease"
            : "none",
      }}
    >
      <div ref={contentRef}>
        <FreePlanUsage to={to} percentage={percentage} />
      </div>
    </div>
  );
}
