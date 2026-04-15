import { useEffect, useMemo, useState } from "react";
import { addToast, useDisclosure } from "@heroui/react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { BottomNav } from "./components/BottomNav";
import { DesktopSidebar } from "./components/DesktopSidebar";
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

const APP_ACTIVE_TAB_KEY = "padexa:last-active-tab";
const APP_FILTER_VALUE_KEY = "padexa:last-filter-value";
const APP_SELECTED_COURT_KEY = "padexa:last-selected-court";
const ALLOWED_APP_TABS = new Set(["panel", "reservas", "socios", "caja"]);

const readStoredString = (key: string, fallback = "") => {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  return typeof value === "string" ? value : fallback;
};

const readStoredTab = () => {
  const storedTab = readStoredString(APP_ACTIVE_TAB_KEY, "panel");
  return ALLOWED_APP_TABS.has(storedTab) ? storedTab : "panel";
};

const getTabFromPathname = (pathname: string): string | null => {
  const [firstSegment = ""] = pathname.split("/").filter(Boolean);
  return ALLOWED_APP_TABS.has(firstSegment) ? firstSegment : null;
};

const isCreateBookingPath = (pathname: string) => pathname === "/reservas/nueva";

const getBookingIdFromPathname = (pathname: string): string | null => {
  const [firstSegment = "", secondSegment = ""] = pathname.split("/").filter(Boolean);
  if (firstSegment !== "reservas") return null;
  if (!secondSegment || secondSegment === "nueva") return null;
  return secondSegment;
};

const getSafeReturnPath = (candidate?: string): string => {
  if (!candidate) return "/reservas";

  const pathname = candidate.split("?")[0];
  if (pathname === "/reservas") return pathname;

  const tab = getTabFromPathname(pathname);
  return tab ? `/${tab}` : "/reservas";
};

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
  const location = useLocation();
  const navigate = useNavigate();
  const { token, user, logout, isLoading: isAuthLoading } = useAuth();
  const [filterValue, setFilterValue] = useState(() =>
    readStoredString(APP_FILTER_VALUE_KEY, ""),
  );
  const [selectedCourt, setSelectedCourt] = useState(() =>
    readStoredString(APP_SELECTED_COURT_KEY, "all"),
  );
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 1024px)").matches;
  });
  const activeTab = useMemo(() => {
    const routeTab = getTabFromPathname(location.pathname);
    return routeTab ?? readStoredTab();
  }, [location.pathname]);
  const isCreating = isCreateBookingPath(location.pathname);
  const bookingIdFromPath = useMemo(
    () => getBookingIdFromPathname(location.pathname),
    [location.pathname],
  );
  const returnPathFromLocationState = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return getSafeReturnPath(state?.from);
  }, [location.state]);

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

  const getNotificationBookingId = (notification: any) => {
    const candidates = [
      notification?.bookingId,
      notification?.booking?._id,
      notification?.data?.bookingId,
      notification?.metadata?.bookingId,
    ];

    return String(
      candidates.find((candidate) => typeof candidate === "string") || "",
    ).trim();
  };

  const handleOpenBookingFromNotification = (notification: any) => {
    const bookingId = getNotificationBookingId(notification);
    if (!bookingId) {
      addToast({
        title: "Esta notificación no tiene un turno vinculado.",
        color: "warning",
      });
      return;
    }

    const relatedBooking = bookings.find((booking: any) => booking?._id === bookingId);
    if (!relatedBooking) {
      navigate("/reservas");
      addToast({
        title: "No encontramos ese turno en memoria. Revisalo desde Reservas.",
        color: "warning",
      });
      return;
    }

    navigate(`/reservas/${relatedBooking._id}`, {
      state: { from: getSafeReturnPath(location.pathname) },
    });
  };

  const handleBookingClick = (booking: any) => {
    setSelectedBooking(booking);

    if (booking.status === "disponible") {
      navigate("/reservas/nueva");
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

    if (booking?._id) {
      navigate(`/reservas/${booking._id}`, {
        state: { from: getSafeReturnPath(location.pathname) },
      });
      return;
    }

    addToast({
      title: "No se pudo abrir el detalle del turno.",
      color: "warning",
    });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [activeTab, isCreating]);

  useEffect(() => {
    if (!bookingIdFromPath) return;
    if (isBookingsLoading) return;

    const relatedBooking = bookings.find((booking: any) => booking?._id === bookingIdFromPath);
    if (relatedBooking) {
      setSelectedBooking(relatedBooking);
      return;
    }

    addToast({
      title: "No encontramos ese turno. Revisalo desde Reservas.",
      color: "warning",
    });
    navigate("/reservas", { replace: true });
  }, [bookingIdFromPath, bookings, isBookingsLoading, navigate]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
    };

    setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(APP_ACTIVE_TAB_KEY, activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(APP_FILTER_VALUE_KEY, filterValue);
  }, [filterValue]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(APP_SELECTED_COURT_KEY, selectedCourt);
  }, [selectedCourt]);

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
            ) : location.pathname === "/" ? (
              <Navigate to={`/${readStoredTab()}`} replace />
            ) : getTabFromPathname(location.pathname) === null ? (
              <Navigate to="/panel" replace />
            ) : (
              <div className="min-h-[100dvh] bg-background text-foreground font-sans pb-safe lg:pb-0 app-shell-root lg:grid lg:grid-cols-[290px_minmax(0,1fr)]">
                <DesktopSidebar
                  activeTab={activeTab}
                  onTabChange={(tab) => navigate(`/${tab}`)}
                  onOpenProfile={onProfileOpen}
                  onLogout={logout}
                />

                <div className="flex flex-col min-h-[100dvh]">
                  <Navbar
                    title={getScreenTitle(activeTab, isCreating)}
                    onAvatarClick={onProfileOpen}
                    onBellClick={onNotifOpen}
                    notificationCount={unreadCount}
                    avatarName={adminName}
                    avatarSrc={navAvatarSrc}
                  />

                  <main
                    className={`flex-grow px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8 w-full max-w-[1520px] mx-auto relative app-shell-main ${isKeyboardOpen ? "pb-4 sm:pb-6 lg:pb-10" : "pb-28 sm:pb-32 lg:pb-10"}`}
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
                        setSelectedBooking(null);
                        navigate("/reservas");
                      }}
                      onFilterChange={setFilterValue}
                      onCourtChange={setSelectedCourt}
                      onBookingClick={handleBookingClick}
                    />
                  </main>
                </div>

                <BottomNav
                  activeTab={activeTab}
                  isKeyboardOpen={isKeyboardOpen}
                  onTabChange={(tab: string) => {
                    if (tab === "fab") {
                      setSelectedBooking(null);
                      navigate("/reservas/nueva");
                      return;
                    }

                    navigate(`/${tab}`);
                  }}
                />

                <BookingDetailDrawer
                  isOpen={Boolean(bookingIdFromPath && selectedBooking)}
                  onOpenChange={(isOpen) => {
                    if (!isOpen) {
                      setSelectedBooking(null);
                      navigate(returnPathFromLocationState);
                    }
                  }}
                  selectedBooking={selectedBooking}
                  setSelectedBooking={setSelectedBooking}
                  updateBooking={updateBooking}
                  deleteBooking={deleteBooking}
                  isDesktop={isDesktop}
                />

                <ProfileDrawer
                  isOpen={isProfileOpen}
                  onOpenChange={onProfileOpenChange}
                  courts={courts}
                  isDesktop={isDesktop}
                />

                <NotificationsDrawer
                  isOpen={isNotifOpen}
                  onOpenChange={onNotifOpenChange}
                  notificationsData={notificationsData}
                  markAllRead={markAllRead}
                  onOpenRelatedBooking={handleOpenBookingFromNotification}
                  isDesktop={isDesktop}
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
