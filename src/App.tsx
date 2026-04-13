import { useEffect, useMemo, useState } from "react";
import { addToast, useDisclosure } from "@heroui/react";
import { Navigate, Route, Routes } from "react-router-dom";

import { BottomNav } from "./components/BottomNav";
import { Navbar } from "./components/Navbar";
import { PwaManager } from "./components/PwaManager";
import { useAuth } from "./context/AuthContext";
import { AppMainContent } from "./features/app-shell/components/AppMainContent";
import { BookingDetailDrawer } from "./features/app-shell/components/BookingDetailDrawer";
import { NotificationsDrawer } from "./features/app-shell/components/NotificationsDrawer";
import { ProfileDrawer } from "./features/app-shell/components/ProfileDrawer";
import { Login } from "./features/auth/page/Login";
import { SuperAdminSetup } from "./features/super-admin/page/SuperAdminSetup";
import {
  useAdmins,
  useBookings,
  useCompanies,
  useCourts,
  useCreateBooking,
  useDeleteBooking,
  useMarkAllRead,
  useNotifications,
  useUpdateBooking,
} from "./hooks/useData";

const getScreenTitle = (activeTab: string, isCreating: boolean) => {
  if (isCreating) return "Nueva Reserva";

  switch (activeTab) {
    case "panel":
      return "Panel Principal";
    case "socios":
      return "Socios";
    case "reservas":
      return "Turnos";
    case "caja":
      return "Caja";
    default:
      return "PADEXA";
  }
};

export default function App() {
  const { token, user, isLoading: isAuthLoading } = useAuth();
  const [filterValue, setFilterValue] = useState("");
  const [activeTab, setActiveTab] = useState("panel");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const isAuthenticated = Boolean(token);
  const isSuperAdmin = user?.role === "super_admin";
  const adminName = (user?.name || user?.username || "Admin PADEXA").trim();
  const navAvatarSrc = `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(
    adminName || user?.id || "AdminPADEXA",
  )}`;

  const createBooking = useCreateBooking();
  const deleteBooking = useDeleteBooking();
  const updateBooking = useUpdateBooking();
  const markAllRead = useMarkAllRead();

  const { data: notificationsData } = useNotifications(isAuthenticated);
  const { data: companiesData, isLoading: isLoadingCompanies } = useCompanies(
    isAuthenticated && isSuperAdmin,
  );
  const { data: adminsData, isLoading: isLoadingAdmins } = useAdmins(
    isAuthenticated && isSuperAdmin,
  );
  const { data: bookingsData, isLoading: isBookingsLoading } = useBookings(
    undefined,
    isAuthenticated,
  );
  const { data: courtsData } = useCourts(false, isAuthenticated);

  const {
    isOpen: isBookingDetailOpen,
    onOpen: onBookingDetailOpen,
    onOpenChange: onBookingDetailOpenChange,
  } = useDisclosure();
  const {
    isOpen: isProfileOpen,
    onOpen: onProfileOpen,
    onOpenChange: onProfileOpenChange,
  } = useDisclosure();
  const {
    isOpen: isNotifOpen,
    onOpen: onNotifOpen,
    onOpenChange: onNotifOpenChange,
  } = useDisclosure();

  const bookings = bookingsData?.data || [];
  const courts = courtsData?.data || [];
  const companies = companiesData?.data || [];
  const admins = adminsData?.data || [];
  const tenantAdmins = admins.filter((admin: any) => admin.role !== "super_admin");
  const needsSuperAdminSetup =
    isAuthenticated &&
    isSuperAdmin &&
    !isLoadingCompanies &&
    !isLoadingAdmins &&
    (companies.length === 0 || tenantAdmins.length === 0);

  const unreadCount = useMemo(() => {
    if (!notificationsData?.data || !Array.isArray(notificationsData.data)) return 0;

    return notificationsData.data.filter((notification: any) => !notification.isRead).length;
  }, [notificationsData]);

  const handleBookingClick = (booking: any) => {
    setSelectedBooking(booking);

    if (booking.status === "disponible") {
      setIsCreating(true);
      return;
    }

    if (booking.status === "suspendido" && !booking._id) {
      createBooking.mutate(
        {
          courtId: booking.court?._id,
          slotId: booking.timeSlot?._id,
          date: booking.date,
          paymentStatus: "pagado",
          finalPrice: 0,
          status: "suspendido",
          clientName: "SISTEMA",
          clientPhone: "MANTENIMIENTO",
        },
        {
          onSuccess: () => {
            addToast({ title: "Turno suspendido bloqueado", color: "success" });
          },
          onError: (err: any) => {
            addToast({
              title: err?.response?.data?.error || "Error al suspender turno",
              color: "danger",
            });
          },
        },
      );
      return;
    }

    onBookingDetailOpen();
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [activeTab, isCreating]);

  useEffect(() => {
    console.log("🔔 Notificaciones actualizadas:", {
      total: notificationsData?.data?.length || 0,
      unread: unreadCount,
      data: notificationsData?.data,
    });
  }, [notificationsData, unreadCount]);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return undefined;

    const updateKeyboardState = () => {
      const keyboardHeight = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );
      const nextIsKeyboardOpen = keyboardHeight > 120;
      setIsKeyboardOpen(nextIsKeyboardOpen);
      document.documentElement.style.setProperty("--keyboard-height", `${keyboardHeight}px`);
      document.body.classList.toggle("keyboard-open", nextIsKeyboardOpen);
    };

    updateKeyboardState();
    viewport.addEventListener("resize", updateKeyboardState);
    viewport.addEventListener("scroll", updateKeyboardState);
    window.addEventListener("orientationchange", updateKeyboardState);

    return () => {
      viewport.removeEventListener("resize", updateKeyboardState);
      viewport.removeEventListener("scroll", updateKeyboardState);
      window.removeEventListener("orientationchange", updateKeyboardState);
      document.documentElement.style.setProperty("--keyboard-height", "0px");
      document.body.classList.remove("keyboard-open");
    };
  }, []);

  if (isAuthLoading) return null;

  return (
    <>
      <PwaManager />
      <Routes>
        <Route
          path="/login"
          element={token ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/*"
          element={
            !token ? (
              <Navigate to="/login" replace />
            ) : needsSuperAdminSetup ? (
              <SuperAdminSetup superAdminUsername={user?.username || "superadmin"} />
            ) : (
              <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans pb-safe app-shell-root">
                <Navbar
                  title={getScreenTitle(activeTab, isCreating)}
                  onAvatarClick={onProfileOpen}
                  onBellClick={onNotifOpen}
                  notificationCount={unreadCount}
                  avatarName={adminName}
                  avatarSrc={navAvatarSrc}
                />

                <main
                  className={`flex-grow px-4 pt-4 sm:px-6 sm:pt-6 w-full max-w-3xl mx-auto relative app-shell-main ${isKeyboardOpen ? "pb-4 sm:pb-6" : "pb-28 sm:pb-32"}`}
                >
                  <AppMainContent
                    activeTab={activeTab}
                    isCreating={isCreating}
                    selectedBooking={selectedBooking}
                    bookings={bookings}
                    courts={courts}
                    isBookingsLoading={isBookingsLoading}
                    filterValue={filterValue}
                    selectedCourt={selectedCourt}
                    onCancelCreate={() => {
                      setIsCreating(false);
                      setSelectedBooking(null);
                    }}
                    onFilterChange={setFilterValue}
                    onCourtChange={setSelectedCourt}
                    onBookingClick={handleBookingClick}
                  />
                </main>

                <BottomNav
                  activeTab={activeTab}
                  isKeyboardOpen={isKeyboardOpen}
                  onTabChange={(tab: string) => {
                    if (tab === "fab") {
                      setIsCreating(true);
                      return;
                    }

                    setActiveTab(tab);
                    setIsCreating(false);
                  }}
                />

                <BookingDetailDrawer
                  isOpen={isBookingDetailOpen}
                  onOpenChange={onBookingDetailOpenChange}
                  selectedBooking={selectedBooking}
                  setSelectedBooking={setSelectedBooking}
                  updateBooking={updateBooking}
                  deleteBooking={deleteBooking}
                />

                <ProfileDrawer
                  isOpen={isProfileOpen}
                  onOpenChange={onProfileOpenChange}
                  courts={courts}
                />

                <NotificationsDrawer
                  isOpen={isNotifOpen}
                  onOpenChange={onNotifOpenChange}
                  notificationsData={notificationsData}
                  markAllRead={markAllRead}
                />
              </div>
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
