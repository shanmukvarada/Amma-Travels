"use client";

import { useState, useEffect, use } from "react";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  db,
  auth,
  storage,
  handleFirestoreError,
  OperationType,
} from "@/lib/firebase";
import { Vehicle, PricingTier } from "@/lib/types";
import { seedVehicles } from "@/lib/seedData";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Fuel,
  Users,
  Check,
  Camera,
  ShieldCheck,
  Info,
} from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";

export default function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [dlFile, setDlFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const docRef = doc(db, "vehicles", resolvedParams.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const v = { id: docSnap.id, ...docSnap.data() } as Vehicle;
          setVehicle(v);
          if (v.pricingTiers && v.pricingTiers.length > 0) {
            // Sort by price ascending
            const sorted = [...v.pricingTiers].sort(
              (a, b) => a.price - b.price,
            );
            setSelectedTier(sorted[0]);
          }
        } else {
          const fallback = seedVehicles.find(v => v.id === resolvedParams.id);
          if (fallback) {
            setVehicle(fallback);
            if (fallback.pricingTiers && fallback.pricingTiers.length > 0) {
              const sorted = [...fallback.pricingTiers].sort((a, b) => a.price - b.price);
              setSelectedTier(sorted[0]);
            }
          }
        }
      } catch (error) {
        // Fallback on error if it's a seed vehicle (e.g. Firebase config missing)
        const fallback = seedVehicles.find(v => v.id === resolvedParams.id);
        if (fallback) {
          setVehicle(fallback);
          if (fallback.pricingTiers && fallback.pricingTiers.length > 0) {
            const sorted = [...fallback.pricingTiers].sort((a, b) => a.price - b.price);
            setSelectedTier(sorted[0]);
          }
        } else {
          handleFirestoreError(
            error,
            OperationType.GET,
            `vehicles/${resolvedParams.id}`,
          );
        }
      } finally {
        setLoading(false);
      }
    };
    fetchVehicle();
  }, [resolvedParams.id]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle || !selectedTier || !aadhaarFile || !dlFile) return;

    setSubmitting(true);
    try {
      if (!auth.currentUser) {
        try {
          const { signInAnonymously } = await import("firebase/auth");
          await signInAnonymously(auth);
        } catch (authError: any) {
          if (authError.code === "auth/admin-restricted-operation") {
            alert(
              "Error: Anonymous Authentication is not enabled in this Firebase project. To fix this, please go to your Firebase Console -> Authentication -> Sign-in Method, and enable 'Anonymous'.",
            );
            setSubmitting(false);
            return;
          }
          throw authError;
        }
      }

      if (!auth.currentUser) throw new Error("Failed to sign in.");

      const aadhaarRef = ref(
        storage,
        `documents/${auth.currentUser.uid}/${Date.now()}_aadhaar`,
      );
      await uploadBytes(aadhaarRef, aadhaarFile);
      const aadhaarUrl = await getDownloadURL(aadhaarRef);

      const dlRef = ref(
        storage,
        `documents/${auth.currentUser.uid}/${Date.now()}_dl`,
      );
      await uploadBytes(dlRef, dlFile);
      const dlUrl = await getDownloadURL(dlRef);

      const bookingData = {
        vehicleId: vehicle.id,
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
        aadhaarDoc: aadhaarUrl,
        dlDoc: dlUrl,
        status: "pending",
        userId: auth.currentUser.uid,
        selectedTier,
        totalAmount: selectedTier.price,
        startKm: 0,
        endKm: 0,
        extraKm: 0,
        extraCharges: 0,
        finalAmount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const bookingRef = await addDoc(collection(db, "bookings"), bookingData);
      router.push(`/booking/${bookingRef.id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "bookings");
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin shadow-lg" />
      </div>
    );

  if (!vehicle)
    return (
      <div className="text-center p-12 bg-neutral-50 h-screen font-heading text-xl">
        Vehicle not found
      </div>
    );

  return (
    <div className="min-h-screen bg-neutral-50 font-sans pb-32">
      <header className="bg-white/90 backdrop-blur-md p-4 sticky top-0 z-50 shadow-sm flex items-center gap-4 border-b border-neutral-200">
        <Link
          href="/"
          className="p-2 -ml-2 text-neutral-600 hover:text-black transition-colors rounded-full hover:bg-neutral-100"
        >
          <ArrowLeft size={24} />
        </Link>
        <span className="font-bold text-lg font-heading tracking-tight">
          Booking Request
        </span>
      </header>

      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white lg:mt-6 lg:rounded-3xl shadow-sm border-x lg:border border-neutral-200 overflow-hidden mb-6"
        >
          <div className="w-full aspect-[4/3] md:aspect-[21/9] bg-neutral-100 relative overflow-hidden group">
            {vehicle.images && vehicle.images.length > 0 ? (
              <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {vehicle.images.map((img, i) => (
                  <div key={i} className="min-w-full h-full snap-center relative">
                    <img
                      src={img}
                      alt={`${vehicle.name} - ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {vehicle.images.length > 1 && (
                  <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
                     {vehicle.images.map((_, i) => (
                       <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/70 shadow-sm"></div>
                     ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-300">
                No Image Available
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            <div className="absolute bottom-4 left-6 right-6 text-white">
              <h1 className="text-2xl md:text-3xl font-black font-heading leading-tight mb-1 drop-shadow-md">
                {vehicle.name}
              </h1>
              <p className="opacity-90 font-medium drop-shadow-sm">
                {vehicle.model} &bull; {vehicle.year}
              </p>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-wrap gap-4 mb-2 text-sm font-semibold text-neutral-700 bg-neutral-50 p-4 rounded-2xl border border-neutral-100/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <Fuel size={16} />
                </div>
                <span className="capitalize">
                  {vehicle.fuelType || "Petrol"}
                </span>
              </div>
              {vehicle.type === "car" && (
                <div className="flex items-center gap-2 border-l border-neutral-200 pl-4">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <Users size={16} />
                  </div>
                  <span>{vehicle.capacity || 5} Seats</span>
                </div>
              )}
            </div>

            {vehicle.description && (
              <div className="mt-4 text-neutral-600 leading-relaxed text-sm bg-neutral-50 p-4 rounded-2xl border border-neutral-100/80">
                <div className="font-bold text-neutral-900 mb-1">About this vehicle</div>
                <p>{vehicle.description}</p>
              </div>
            )}
          </div>
        </motion.div>

        {vehicle.status !== "available" ? (
          <div className="p-5 mx-4 md:mx-0 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl font-bold flex items-center gap-3 shadow-sm">
            <Info size={24} className="shrink-0" />
            This vehicle is currently on the road and not available for booking.
          </div>
        ) : (
          <form
            id="booking-form"
            onSubmit={handleBooking}
            className="px-4 md:px-0 space-y-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-4 mt-2">
                <h2 className="text-xl font-black font-heading">
                  1. Select Package
                </h2>
                {selectedTier && (
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    {selectedTier.durationHrs}H Selected
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vehicle.pricingTiers
                  ?.sort((a, b) => a.durationHrs - b.durationHrs)
                  .map((tier, idx) => {
                    const isSelected = selectedTier === tier;
                    return (
                      <div
                        key={idx}
                        className={`relative border-2 rounded-2xl p-5 cursor-pointer transition-all ${isSelected ? "border-red-600 bg-red-50/50 shadow-md shadow-red-100" : "border-neutral-200 bg-white hover:border-red-300 hover:shadow-sm"}`}
                        onClick={() => setSelectedTier(tier)}
                      >
                        {isSelected && (
                          <div className="absolute top-4 right-4 bg-red-600 text-white rounded-full p-0.5 shadow-sm">
                            <Check size={16} />
                          </div>
                        )}
                        <div className="flex flex-col mb-3">
                          <span className="font-black text-2xl font-heading text-neutral-900">
                            {tier.durationHrs} Hours
                          </span>
                          <span className="font-black text-xl text-red-600 mt-1">
                            ₹{tier.price}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-neutral-600 space-y-2 mt-4 pt-4 border-t border-neutral-200/50">
                          <div className="flex items-center gap-2">
                            <Check size={16} className="text-green-500" />{" "}
                            Included: {tier.kmLimit} KM
                          </div>
                          <div className="flex items-center gap-2">
                            <Check size={16} className="text-green-500" />{" "}
                            Extra: ₹{tier.extraKmCharge}/KM
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-xl font-black font-heading mb-4 mt-8">
                2. Driver Details
              </h2>
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-5">
                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-2">
                    Full Name (As per DL)
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-4 focus:ring-red-600/10 focus:border-red-600 outline-none transition-all font-medium"
                    placeholder="E.g. Rahul Kumar"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-4 focus:ring-red-600/10 focus:border-red-600 outline-none transition-all font-medium"
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-2">
                    Current Address
                  </label>
                  <textarea
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-4 focus:ring-red-600/10 focus:border-red-600 outline-none transition-all font-medium resize-none"
                    placeholder="Enter your full residential address"
                  />
                </div>

                <div className="pt-6 mt-6 border-t border-neutral-100">
                  <div className="bg-blue-50/80 border border-blue-100 p-4 rounded-2xl flex items-start gap-3 text-sm text-blue-800 mb-6 font-medium">
                    <ShieldCheck
                      size={20}
                      className="shrink-0 mt-0.5 text-blue-600"
                    />
                    <p>
                      Upload clear, readable photos of original documents. Your
                      data is stored securely and verified match your ID.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-neutral-700 mb-2">
                        Aadhaar Card
                      </label>
                      <label
                        className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed p-6 rounded-2xl cursor-pointer transition-all ${aadhaarFile ? "border-green-400 bg-green-50" : "border-neutral-300 hover:bg-neutral-50 hover:border-red-300"}`}
                      >
                        {aadhaarFile ? (
                          <Check size={28} className="text-green-500" />
                        ) : (
                          <Camera size={28} className="text-neutral-400" />
                        )}
                        <span
                          className={`font-semibold text-center text-sm ${aadhaarFile ? "text-green-700" : "text-neutral-500"}`}
                        >
                          {aadhaarFile
                            ? aadhaarFile.name
                            : "Front & Back Photo"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          required
                          onChange={(e) =>
                            e.target.files && setAadhaarFile(e.target.files[0])
                          }
                        />
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-neutral-700 mb-2">
                        Driving License
                      </label>
                      <label
                        className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed p-6 rounded-2xl cursor-pointer transition-all ${dlFile ? "border-green-400 bg-green-50" : "border-neutral-300 hover:bg-neutral-50 hover:border-red-300"}`}
                      >
                        {dlFile ? (
                          <Check size={28} className="text-green-500" />
                        ) : (
                          <Camera size={28} className="text-neutral-400" />
                        )}
                        <span
                          className={`font-semibold text-center text-sm ${dlFile ? "text-green-700" : "text-neutral-500"}`}
                        >
                          {dlFile ? dlFile.name : "Clear Photo of DL"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          required
                          onChange={(e) =>
                            e.target.files && setDlFile(e.target.files[0])
                          }
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </form>
        )}
      </div>

      {vehicle.status === "available" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <div className="hidden sm:block">
              <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-0.5">
                Total Package
              </p>
              <p className="text-xl font-black text-neutral-900 font-heading">
                ₹{selectedTier ? selectedTier.price : 0}
              </p>
            </div>
            <button
              type="submit"
              form="booking-form"
              disabled={submitting || !selectedTier}
              className="flex-1 sm:flex-none sm:w-[240px] bg-red-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-red-600/20 hover:bg-red-700 hover:shadow-red-600/40 active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:bg-neutral-300 disabled:shadow-none disabled:active:scale-100"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                "Send Request"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
