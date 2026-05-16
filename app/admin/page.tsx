"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { Booking, Vehicle } from "@/lib/types";
import { formatDistanceToNow, format } from "date-fns";
import { FileImage, Phone, CheckCircle, XCircle } from "lucide-react";

// For date-fns
// Please run `npm install date-fns`

export default function AdminDashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Record<string, Vehicle>>({});

  // Return handling state
  const [returningBooking, setReturningBooking] = useState<Booking | null>(
    null,
  );
  const [finalKm, setFinalKm] = useState("");

  useEffect(() => {
    // Listen to active bookings
    const q = query(
      collection(db, "bookings"),
      where("status", "in", ["pending", "approved"]),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const b = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Booking,
        );
        // Sort: pending first, then by date
        setBookings(
          b.sort((x, y) => {
            if (x.status === "pending" && y.status !== "pending") return -1;
            if (x.status !== "pending" && y.status === "pending") return 1;
            return (y.createdAt?.seconds || 0) - (x.createdAt?.seconds || 0);
          }),
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, "bookings"),
    );

    // Listen to all vehicles to resolve references
    const vq = query(collection(db, "vehicles"));
    const vunsub = onSnapshot(vq, (snapshot) => {
      const vMap: Record<string, Vehicle> = {};
      snapshot.forEach((doc) => {
        vMap[doc.id] = { id: doc.id, ...doc.data() } as Vehicle;
      });
      setVehicles(vMap);
    });

    return () => {
      unsubscribe();
      vunsub();
    };
  }, []);

  const handleApprove = async (b: Booking) => {
    try {
      if (!window.confirm("Approve this booking?")) return;
      // Mark booking approved
      await updateDoc(doc(db, "bookings", b.id), {
        status: "approved",
        startTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      // Mark vehicle on-road
      await updateDoc(doc(db, "vehicles", b.vehicleId), {
        status: "on-road",
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `bookings/${b.id}`);
    }
  };

  const handleCompleteBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningBooking) return;
    const km = Number(finalKm);

    // Calculate charges if any
    const tier = returningBooking.selectedTier;
    const distanceTraveled = km - (returningBooking.startKm || 0);
    let extraKm = 0;
    let extraCharges = 0;

    if (distanceTraveled > tier.kmLimit) {
      extraKm = distanceTraveled - tier.kmLimit;
      extraCharges = extraKm * tier.extraKmCharge;
    }

    try {
      await updateDoc(doc(db, "bookings", returningBooking.id), {
        status: "completed",
        actualReturnTime: serverTimestamp(),
        endKm: km,
        extraKm,
        extraCharges,
        finalAmount: tier.price + extraCharges,
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "vehicles", returningBooking.vehicleId), {
        status: "available",
        updatedAt: serverTimestamp(),
      });

      setReturningBooking(null);
      setFinalKm("");
      alert("Booking completed successfully.");
    } catch (e) {
      handleFirestoreError(
        e,
        OperationType.UPDATE,
        `bookings/${returningBooking.id}`,
      );
    }
  };

  const pendingRequests = bookings.filter((b) => b.status === "pending");
  const onRoadRequests = bookings.filter((b) => b.status === "approved");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black mb-1 text-black">Live Operations</h2>
        <p className="text-neutral-500">
          Monitor new requests and active fleet on the road.
        </p>
      </div>

      {pendingRequests.length > 0 && (
        <section>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-600">
            <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
            New Pending Requests ({pendingRequests.length})
          </h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {pendingRequests.map((b) => (
              <div
                key={b.id}
                className="bg-white p-5 border border-amber-200 rounded-xl shadow-sm relative"
              >
                <div className="absolute top-0 right-0 bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                  PENDING
                </div>

                <h4 className="font-bold text-lg">{b.customerName}</h4>
                <a
                  href={`tel:${b.customerPhone}`}
                  className="text-red-500 font-medium inline-flex items-center gap-1 mb-4 hover:underline"
                >
                  <Phone size={14} /> {b.customerPhone}
                </a>

                <div className="bg-neutral-50 p-3 rounded-lg mb-4 text-sm flex justify-between items-center border">
                  <div>
                    <p className="font-semibold">
                      {vehicles[b.vehicleId]?.name || "Unknown Vehicle"}
                    </p>
                    <p className="text-neutral-500">
                      {b.selectedTier?.durationHrs}hrs Package • ₹
                      {b.selectedTier?.price}
                    </p>
                  </div>
                  <div className="text-xs text-neutral-400">
                    {b.createdAt?.seconds
                      ? formatDistanceToNow(
                          new Date(b.createdAt.seconds * 1000),
                          { addSuffix: true },
                        )
                      : "Just now"}
                  </div>
                </div>

                <div className="flex gap-2 mb-4">
                  {b.aadhaarDoc && (
                    <a
                      href={b.aadhaarDoc}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex gap-2 items-center justify-center py-2 px-3 bg-blue-50 text-blue-700 rounded text-sm font-semibold hover:bg-blue-100"
                    >
                      <FileImage size={16} /> View Aadhaar
                    </a>
                  )}
                  {b.dlDoc && (
                    <a
                      href={b.dlDoc}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex gap-2 items-center justify-center py-2 px-3 bg-blue-50 text-blue-700 rounded text-sm font-semibold hover:bg-blue-100"
                    >
                      <FileImage size={16} /> View DL
                    </a>
                  )}
                </div>

                <button
                  onClick={() => handleApprove(b)}
                  className="w-full bg-black text-white font-bold py-3 rounded-lg hover:bg-neutral-800 transition flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} /> Approve & Dispatch
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-xl font-bold mb-4">
          On the Road ({onRoadRequests.length})
        </h3>
        {onRoadRequests.length === 0 ? (
          <div className="p-8 border border-dashed rounded-xl text-center text-neutral-400">
            No vehicles currently on the road.
          </div>
        ) : (
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b">
                <tr>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Started At</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {onRoadRequests.map((b) => (
                  <tr key={b.id} className="hover:bg-neutral-50/50">
                    <td className="p-4">
                      <div className="font-bold">{b.customerName}</div>
                      <div className="text-neutral-500 text-xs">
                        {b.customerPhone}
                      </div>
                    </td>
                    <td className="p-4 font-medium">
                      {vehicles[b.vehicleId]?.name || "Unknown"}
                    </td>
                    <td className="p-4 text-neutral-500">
                      {b.startTime?.seconds
                        ? format(
                            new Date(b.startTime.seconds * 1000),
                            "MMM d, h:mm a",
                          )
                        : "N/A"}
                    </td>
                    <td className="p-4">
                      <div className="font-medium">
                        {b.selectedTier?.durationHrs} Hrs
                      </div>
                      <div className="text-xs text-amber-600 font-semibold">
                        {b.selectedTier?.kmLimit} KM Limit
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setReturningBooking(b)}
                        className="px-4 py-2 bg-neutral-900 text-white font-bold rounded-lg hover:bg-neutral-800 text-xs shadow-sm"
                      >
                        Complete Return
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Return Handling Modal */}
      {returningBooking && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Complete Booking</h3>
            <form onSubmit={handleCompleteBooking} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Final Odometer Reading (KM)
                </label>
                <input
                  type="number"
                  required
                  value={finalKm}
                  onChange={(e) => setFinalKm(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none"
                  placeholder="e.g. 4500"
                />
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg text-sm border space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Base Price</span>{" "}
                  <span>₹{returningBooking.selectedTier?.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Included Distance</span>{" "}
                  <span>{returningBooking.selectedTier?.kmLimit} KM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Extra per KM</span>{" "}
                  <span>₹{returningBooking.selectedTier?.extraKmCharge}</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReturningBooking(null)}
                  className="flex-1 py-3 bg-neutral-100 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-black text-white font-bold rounded-lg"
                >
                  Finalize Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
