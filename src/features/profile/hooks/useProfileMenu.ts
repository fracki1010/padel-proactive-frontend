import { useEffect, useState } from "react";

import { useUpdateProfile } from "../../../hooks/useData";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";

type UseProfileMenuParams = {
  courtsCount: number;
  whatsappEnabled: boolean;
  whatsappStatus: string;
  whatsappStatusLabelByKey: Record<string, string>;
  setView: (
    view:
      | "menu"
      | "courts"
      | "schedule"
      | "whatsapp"
      | "bot-automation"
      | "deposits"
      | "tenants"
      | "club-closures"
      | "announcements",
  ) => void;
};

export const useProfileMenu = ({
  courtsCount,
  whatsappEnabled,
  whatsappStatus,
  whatsappStatusLabelByKey,
  setView,
}: UseProfileMenuParams) => {
  const { logout, user, updateUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const updateProfile = useUpdateProfile();

  const [phoneNumber, setPhoneNumber] = useState("");

  const isSuperAdmin = user?.role === "super_admin";
  const canManageClubData = isSuperAdmin || Boolean(user?.companyId);

  useEffect(() => {
    if (user?.phone) {
      setPhoneNumber(user.phone);
    }
  }, [user]);

  const handleUpdatePhone = () => {
    updateProfile.mutate(
      { phone: phoneNumber },
      {
        onSuccess: (response) => {
          updateUser(response.data);
        },
      },
    );
  };

  return {
    user,
    isSuperAdmin,
    canManageClubData,
    courtsCount,
    phoneNumber,
    savedPhoneNumber: String(user?.phone || ""),
    whatsappEnabled,
    whatsappStatus,
    whatsappStatusLabelByKey,
    updateProfilePending: updateProfile.isPending,
    isDarkMode: isDark,
    onPhoneChange: setPhoneNumber,
    onSavePhone: handleUpdatePhone,
    onToggleTheme: toggleTheme,
    onGoToCourts: () => setView("courts"),
    onGoToWhatsapp: () => setView("whatsapp"),
    onGoToSchedule: () => setView("schedule"),
    onGoToBotAutomation: () => setView("bot-automation"),
    onGoToDeposits: () => setView("deposits"),
    onGoToTenants: () => setView("tenants"),
    onGoToClubClosures: () => setView("club-closures"),
    onGoToAnnouncements: () => setView("announcements"),
    onLogout: logout,
  };
};
