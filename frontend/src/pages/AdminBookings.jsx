import React from 'react';
import { useGetAdminBookingsQuery } from '../redux/apiSlice';
import FullScreenLoader from '../components/shared/FullScreenLoader';
import { formatShowDate } from '../utils/dateFormatter';
import dayjs from 'dayjs';

const AdminBookings = () => {
  const { data, isLoading, isError } = useGetAdminBookingsQuery();

  if (isLoading) return <FullScreenLoader />;
  if (isError) return <div className="p-8 text-center text-red-500">Failed to load admin bookings.</div>;

  const bookings = data?.bookings || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight text-[#171717]">Platform Bookings</h1>
        <div className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm">
          Total: <span className="text-[#8f46ff]">{bookings.length}</span>
        </div>
      </div>

      <div className="cine-card overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="border-b border-black/5 bg-[#f6f3ee]/50 text-[13px] uppercase tracking-wider text-[#6f6660]">
              <tr>
                <th className="px-6 py-4 font-black">Date</th>
                <th className="px-6 py-4 font-black">User</th>
                <th className="px-6 py-4 font-black">Movie & Show</th>
                <th className="px-6 py-4 font-black">Seats</th>
                <th className="px-6 py-4 font-black">Amount</th>
                <th className="px-6 py-4 font-black">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {bookings.map((booking) => (
                <tr key={booking._id} className="transition hover:bg-black/[0.02]">
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-[#171717]">
                    {dayjs(booking.createdAt).format('DD MMM YYYY')}
                    <br />
                    <span className="text-[13px] text-[#6f6660]">{dayjs(booking.createdAt).format('HH:mm A')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-[#171717]">{booking.userId?.name || 'Unknown'}</p>
                    <p className="text-[13px] text-[#6f6660]">{booking.userId?.email || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-[#171717]">{booking.showId?.movie?.title}</p>
                    <p className="text-[13px] text-[#6f6660]">
                      {booking.showId?.theater?.name}
                    </p>
                    <p className="text-[13px] font-medium text-[#8f46ff]">
                      {formatShowDate(booking.showId?.date, "D MMM")} @ {booking.showId?.startTime}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-[#171717]">{booking.seats?.length} tickets</p>
                    <p className="text-[13px] text-[#6f6660] break-words max-w-[150px]">{booking.seats?.join(', ')}</p>
                  </td>
                  <td className="px-6 py-4 font-black text-[#171717]">
                    Rs.{booking.bookingFee?.total || 0}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[12px] font-bold text-emerald-700">
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-[#6f6660]">
                    No bookings found on the platform.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminBookings;
