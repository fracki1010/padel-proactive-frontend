import { useEffect, useState } from "react";

import { useClubClosuresManagement } from "../hooks/useClubClosuresManagement";
import { useCourtsManagement } from "../hooks/useCourtsManagement";
import { useScheduleManagement } from "../hooks/useScheduleManagement";
import { useTenantsManagement } from "../hooks/useTenantsManagement";
import { useProfileMenu } from "../hooks/useProfileMenu";
import { useBotAutomationManagement } from "../hooks/useBotAutomationManagement";
import { useWhatsappManagement } from "../hooks/useWhatsappManagement";

import { ClubClosuresView } from "../components/ClubClosuresView";
import { CourtsView } from "../components/CourtsView";
import { BotAutomationSettingsView } from "../components/BotAutomationSettingsView";
import { ProfileMenuView } from "../components/ProfileMenuView";
import { ScheduleSettingsView } from "../components/ScheduleSettingsView";
import { TenantsView } from "../components/TenantsView";
import { WhatsappSettingsView } from "../components/WhatsappSettingsView";

interface ProfileProps {
  courts: any[];
}

type ViewType =
  | "menu"
  | "courts"
  | "schedule"
  | "whatsapp"
  | "bot-automation"
  | "tenants"
  | "club-closures";

export const Profile = ({ courts: initialCourts }: ProfileProps) => {
  const [view, setView] = useState<ViewType>("menu");

  const clubClosures = useClubClosuresManagement();
  const courts = useCourtsManagement(initialCourts);
  const schedule = useScheduleManagement();
  const tenants = useTenantsManagement();
  const whatsapp = useWhatsappManagement();
  const botAutomation = useBotAutomationManagement(whatsapp);
  const menu = useProfileMenu({
    courtsCount: courts.courts.length,
    whatsappEnabled: whatsapp.whatsappEnabled,
    whatsappStatus: whatsapp.whatsappStatus,
    whatsappStatusLabelByKey: whatsapp.whatsappStatusLabelByKey,
    setView,
  });

  // Scroll to top on view change
  useEffect(() => {
    const profileScrollContainer = document.getElementById("profile-drawer-body");
    profileScrollContainer?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [view]);

  // Refetch whatsapp groups when entering whatsapp view
  useEffect(() => {
    if (view !== "whatsapp") return;

    void whatsapp.refetchWhatsappGroups();

    if (!whatsapp.whatsappEnabledForEffect || !whatsapp.workerOnlineForEffect) return;
    const retryTimer = window.setTimeout(() => {
      void whatsapp.refetchWhatsappGroups();
    }, 3500);

    return () => window.clearTimeout(retryTimer);
  }, [
    view,
    whatsapp.whatsappEnabledForEffect,
    whatsapp.workerOnlineForEffect,
    whatsapp.refetchWhatsappGroups,
  ]);

  switch (view) {
    case "whatsapp":
      return (
        <WhatsappSettingsView
          whatsappEnabled={whatsapp.whatsappEnabled}
          whatsappStatus={whatsapp.whatsappStatus}
          whatsappQr={whatsapp.whatsappQr}
          whatsappState={whatsapp.whatsappState}
          workerOnline={whatsapp.workerOnline}
          workerHeartbeatAt={whatsapp.workerHeartbeatAt}
          isLoadingWhatsapp={whatsapp.isLoadingWhatsapp}
          updateWhatsappPending={whatsapp.updateWhatsappPending}
          whatsappChipColor={whatsapp.whatsappChipColor}
          whatsappStatusLabelByKey={whatsapp.whatsappStatusLabelByKey}
          cancellationGroupEnabled={whatsapp.cancellationGroupEnabled}
          cancellationGroupIdInput={whatsapp.cancellationGroupIdInput}
          cancellationGroupNameInput={whatsapp.cancellationGroupNameInput}
          whatsappGroups={whatsapp.whatsappGroups}
          isLoadingWhatsappGroups={whatsapp.isLoadingWhatsappGroups}
          updateCancellationGroupPending={whatsapp.updateCancellationGroupPending}
          onBack={() => setView("menu")}
          onToggleWhatsapp={whatsapp.handleToggleWhatsapp}
          onCloseWhatsappSession={whatsapp.handleCloseWhatsappSession}
          onSwitchWhatsappDevice={whatsapp.handleSwitchWhatsappDevice}
          onResetWhatsappSession={whatsapp.handleResetWhatsappSession}
          onCancellationGroupEnabledChange={whatsapp.handleToggleCancellationGroup}
          onSelectWhatsappGroup={whatsapp.handleSelectWhatsappGroup}
        />
      );

    case "tenants":
      return (
        <TenantsView
          isSuperAdmin={tenants.isSuperAdmin}
          companies={tenants.companies}
          admins={tenants.admins}
          companyNameInput={tenants.companyNameInput}
          newAdminUsername={tenants.newAdminUsername}
          newAdminPassword={tenants.newAdminPassword}
          newAdminPhone={tenants.newAdminPhone}
          newAdminCompanyId={tenants.newAdminCompanyId}
          createCompanyPending={tenants.createCompanyPending}
          updateCompanyPending={tenants.updateCompanyPending}
          updateCompanyStatusPending={tenants.updateCompanyStatusPending}
          bootstrapPending={tenants.bootstrapPending}
          createAdminPending={tenants.createAdminPending}
          updateAdminStatusPending={tenants.updateAdminStatusPending}
          onBack={() => setView("menu")}
          onCompanyNameChange={tenants.setCompanyNameInput}
          onAdminUsernameChange={tenants.setNewAdminUsername}
          onAdminPasswordChange={tenants.setNewAdminPassword}
          onAdminPhoneChange={tenants.setNewAdminPhone}
          onAdminCompanyChange={tenants.setNewAdminCompanyId}
          onCreateCompany={tenants.handleCreateCompany}
          onBootstrapTenant={tenants.handleBootstrapTenant}
          onCreateAdmin={tenants.handleCreateAdmin}
          onUpdateCompanyStatus={tenants.handleUpdateCompanyStatus}
          onUpdateCompany={tenants.handleUpdateCompany}
          onUpdateAdminStatus={tenants.handleUpdateAdminStatus}
        />
      );

    case "bot-automation":
      return (
        <BotAutomationSettingsView
          oneHourReminderEnabled={botAutomation.oneHourReminderEnabled}
          penaltyEnabled={botAutomation.penaltyEnabled}
          attendanceReminderLeadMinutesInput={
            botAutomation.attendanceReminderLeadMinutesInput
          }
          attendanceResponseTimeoutMinutesInput={
            botAutomation.attendanceResponseTimeoutMinutesInput
          }
          cancellationLockHoursInput={botAutomation.cancellationLockHoursInput}
          trustedClientConfirmationCountInput={
            botAutomation.trustedClientConfirmationCountInput
          }
          penaltyLimitInput={botAutomation.penaltyLimitInput}
          dailyAvailabilityDigestEnabled={
            botAutomation.dailyAvailabilityDigestEnabled
          }
          dailyAvailabilityDigestHourInput={
            botAutomation.dailyAvailabilityDigestHourInput
          }
          dailyAvailabilityDigestNextDayEnabled={
            botAutomation.dailyAvailabilityDigestNextDayEnabled
          }
          cancellationGroupConfigured={
            botAutomation.cancellationGroupConfigured
          }
          isSavingReminderToggle={botAutomation.isSavingReminderToggle}
          isSavingPenaltyToggle={botAutomation.isSavingPenaltyToggle}
          isSavingReminderMinutes={botAutomation.isSavingReminderMinutes}
          isSavingResponseTimeoutMinutes={
            botAutomation.isSavingResponseTimeoutMinutes
          }
          isSavingCancellationLockHours={
            botAutomation.isSavingCancellationLockHours
          }
          isSavingTrustedCount={botAutomation.isSavingTrustedCount}
          isSavingPenaltyLimit={botAutomation.isSavingPenaltyLimit}
          isSavingDailyAvailabilityDigestSettings={
            botAutomation.isSavingDailyAvailabilityDigestSettings
          }
          onBack={() => setView("menu")}
          onToggleOneHourReminder={botAutomation.onToggleOneHourReminder}
          onTogglePenaltyEnabled={botAutomation.onTogglePenaltyEnabled}
          onAttendanceReminderLeadMinutesChange={
            botAutomation.onAttendanceReminderLeadMinutesChange
          }
          onAttendanceResponseTimeoutMinutesChange={
            botAutomation.onAttendanceResponseTimeoutMinutesChange
          }
          onCancellationLockHoursChange={
            botAutomation.onCancellationLockHoursChange
          }
          onTrustedClientConfirmationCountChange={
            botAutomation.onTrustedClientConfirmationCountChange
          }
          onPenaltyLimitChange={botAutomation.onPenaltyLimitChange}
          onToggleDailyAvailabilityDigest={
            botAutomation.onToggleDailyAvailabilityDigest
          }
          onDailyAvailabilityDigestHourChange={
            botAutomation.onDailyAvailabilityDigestHourChange
          }
          onToggleDailyAvailabilityDigestNextDay={
            botAutomation.onToggleDailyAvailabilityDigestNextDay
          }
          dailyAvailabilityDigestFormat={
            botAutomation.dailyAvailabilityDigestFormat
          }
          onDailyAvailabilityDigestFormatChange={
            botAutomation.onDailyAvailabilityDigestFormatChange
          }
          onSaveReminderMinutes={botAutomation.onSaveReminderMinutes}
          onSaveAttendanceResponseTimeoutMinutes={
            botAutomation.onSaveAttendanceResponseTimeoutMinutes
          }
          onSaveCancellationLockHours={
            botAutomation.onSaveCancellationLockHours
          }
          onSaveTrustedCount={botAutomation.onSaveTrustedCount}
          onSavePenaltyLimit={botAutomation.onSavePenaltyLimit}
          onSaveDailyAvailabilityDigestSettings={
            botAutomation.onSaveDailyAvailabilityDigestSettings
          }
          digestBackgrounds={botAutomation.digestBackgrounds}
          isUploadingBackground={botAutomation.isUploadingBackground}
          isDeletingBackground={botAutomation.isDeletingBackground}
          onUploadBackground={botAutomation.onUploadBackground}
          onDeleteBackground={botAutomation.onDeleteBackground}
          onSendDigestNow={botAutomation.onSendDigestNow}
          isSendingDigestNow={botAutomation.isSendingDigestNow}
        />
      );

    case "club-closures":
      return (
        <ClubClosuresView
          closures={clubClosures.closures}
          createPending={clubClosures.createPending}
          updatePending={clubClosures.updatePending}
          deletePendingId={clubClosures.deletePendingId}
          onBack={() => setView("menu")}
          onCreate={clubClosures.handleCreate}
          onUpdate={clubClosures.handleUpdate}
          onDelete={clubClosures.handleDelete}
        />
      );

    case "courts":
      return (
        <CourtsView
          courts={courts.courts}
          createCourtPending={courts.createCourtPending}
          updateCourtPending={courts.updateCourtPending}
          deleteCourtPendingId={courts.deleteCourtPendingId}
          onBack={() => setView("menu")}
          onCreateCourt={courts.handleCreateCourt}
          onToggleCourt={courts.handleToggleCourt}
          onSaveCourtName={courts.handleSaveCourtName}
          onDeleteCourt={courts.handleDeleteCourt}
        />
      );

    case "schedule":
      return (
        <ScheduleSettingsView
          slots={schedule.slots}
          newSlotStartTime={schedule.newSlotStartTime}
          newSlotEndTime={schedule.newSlotEndTime}
          newSlotPrice={schedule.newSlotPrice}
          basePriceInput={schedule.basePriceInput}
          createSlotPending={schedule.createSlotPending}
          updateBasePricePending={schedule.updateBasePricePending}
          slotTogglePendingId={schedule.slotTogglePendingId}
          onBack={() => setView("menu")}
          onSlotStartTimeChange={schedule.setNewSlotStartTime}
          onSlotEndTimeChange={schedule.setNewSlotEndTime}
          onSlotPriceChange={schedule.setNewSlotPrice}
          onBasePriceChange={schedule.setBasePriceInput}
          onCreateSlot={schedule.handleCreateSlot}
          onSaveBasePrice={schedule.handleSaveBasePrice}
          onToggleSlot={schedule.handleToggleSlot}
        />
      );

    default:
      return <ProfileMenuView {...menu} />;
  }
};
