"use client";

import { useState, useEffect, use } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { Booking } from "@/lib/types";
import Link from "next/link";
import { CheckCircle, Clock, XCircle, Phone } from "lucide-react";
import { motion } from "motion/react";

export default function BookingStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, "bookings", resolvedParams.id);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setBooking({ id: docSnap.id, ...docSnap.data() } as Booking);
        } else {
          setBooking(null);
        }
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(
          error,
          OperationType.GET,
          `bookings/${resolvedParams.id}`,
        );
      },
    );

    return () => unsubscribe();
  }, [resolvedParams.id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin shadow-lg" />
      </div>
    );
  if (!booking)
    return (
      <div className="text-center p-12 bg-neutral-50 h-screen font-heading text-xl">
        Booking not found
      </div>
    );

  return (
    <div className="min-h-screen bg-neutral-50 p-4 pt-10 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto bg-white rounded-3xl shadow-xl shadow-neutral-200/50 border border-neutral-100 overflow-hidden"
      >
        <div
          className={`p-8 text-center relative overflow-hidden ${
            booking.status === "pending"
              ? "bg-amber-400 text-amber-950"
              : booking.status === "approved"
                ? "bg-green-500 text-white"
                : booking.status === "completed"
                  ? "bg-blue-600 text-white"
                  : "bg-red-500 text-white"
          }`}
        >
          {/* Subtle background pattern */}
          <div
            className="absolute inset-0 bg-white/10 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "16px 16px",
            }}
          ></div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative z-10"
          >
            {booking.status === "pending" && (
              <Clock size={72} strokeWidth={1.5} className="mx-auto mb-4" />
            )}
            {booking.status === "approved" && (
              <CheckCircle
                size={72}
                strokeWidth={1.5}
                className="mx-auto mb-4"
              />
            )}
            {booking.status === "completed" && (
              <CheckCircle
                size={72}
                strokeWidth={1.5}
                className="mx-auto mb-4"
              />
            )}
            {booking.status === "cancelled" && (
              <XCircle size={72} strokeWidth={1.5} className="mx-auto mb-4" />
            )}
          </motion.div>

          <h1 className="text-4xl font-black mb-1 capitalize tracking-tight font-heading relative z-10">
            {booking.status}
          </h1>
          <p className="opacity-80 font-bold tracking-widest text-sm relative z-10">
            REF ID: {booking.id.substring(0, 8).toUpperCase()}
          </p>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            {booking.status === "pending" && (
              <p className="text-neutral-600 font-medium text-lg leading-relaxed">
                Your booking request has been received. Our team is verifying
                your documents and will approve shortly.
              </p>
            )}
            {booking.status === "approved" && (
              <p className="text-neutral-600 font-medium text-lg leading-relaxed">
                Your booking is approved! You can pick up your vehicle. Please
                pay{" "}
                <span className="font-bold text-black border-b-2 border-green-500">
                  ₹{booking.selectedTier?.price}
                </span>{" "}
                at pickup.
              </p>
            )}
          </div>

          <div className="bg-neutral-50 rounded-2xl p-5 mb-8 border border-neutral-100 space-y-4">
            <div>
              <p className="text-[10px] text-neutral-400 uppercase font-black tracking-widest mb-1">
                Customer Details
              </p>
              <p className="font-bold text-neutral-900">
                {booking.customerName}
              </p>
              <p className="text-sm font-medium text-neutral-500">
                {booking.customerPhone}
              </p>
            </div>

            <div className="pt-4 border-t border-neutral-200/60">
              <p className="text-[10px] text-neutral-400 uppercase font-black tracking-widest mb-1">
                Package Details
              </p>
              <p className="font-bold text-neutral-900">
                {booking.selectedTier?.durationHrs} Hours Limit
              </p>
              <p className="text-sm font-medium text-neutral-500">
                Base Price: ₹{booking.selectedTier?.price}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/"
              className="flex-1 py-4 text-center rounded-xl bg-neutral-100 font-bold hover:bg-neutral-200 transition-colors active:scale-95 text-neutral-800"
            >
              Back Home
            </Link>
            <a
              href="tel:9652520222"
              className="flex-1 py-4 text-center rounded-xl bg-black text-white font-bold hover:bg-neutral-800 transition-colors flex justify-center items-center gap-2 active:scale-95 hover:shadow-lg hover:shadow-black/20"
            >
              <Phone size={18} /> Support
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
