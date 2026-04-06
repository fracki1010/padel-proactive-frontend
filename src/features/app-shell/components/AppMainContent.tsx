import { BookingForm } from "../../../components/BookingForm";
import { Bookings } from "../../bookings/page/Bookings";
import { Clients } from "../../clients/page/Clients";
import { Dashboard } from "../../dashboard/page/Dashboard";
import { Finance } from "../../finance/page/Finance";

type AppMainContentProps = {
  activeTab: string;
  isCreating: boolean;
  selectedBooking: any;
  bookings: any[];
  courts: any[];
  isBookingsLoading: boolean;
  filterValue: string;
  selectedCourt: string;
  onCancelCreate: () => void;
  onFilterChange: (value: string) => void;
  onCourtChange: (court: string) => void;
  onBookingClick: (booking: any) => void;
};

export const AppMainContent = ({
  activeTab,
  isCreating,
  selectedBooking,
  bookings,
  courts,
  isBookingsLoading,
  filterValue,
  selectedCourt,
  onCancelCreate,
  onFilterChange,
  onCourtChange,
  onBookingClick,
}: AppMainContentProps) => {
  if (isCreating) {
    return (
      <BookingForm
        initialData={selectedBooking}
        onCancel={onCancelCreate}
      />
    );
  }

  switch (activeTab) {
    case "panel":
      return <Dashboard courts={courts} onBookingClick={onBookingClick} />;
    case "socios":
      return (
        <Clients filterValue={filterValue} onFilterChange={onFilterChange} />
      );
    case "reservas":
      return (
        <Bookings
          bookings={bookings}
          courts={courts}
          isLoading={isBookingsLoading}
          filterValue={filterValue}
          onFilterChange={onFilterChange}
          selectedCourt={selectedCourt}
          onCourtChange={onCourtChange}
          onBookingClick={onBookingClick}
        />
      );
    case "caja":
      return <Finance bookings={bookings} />;
    default:
      return null;
  }
};
