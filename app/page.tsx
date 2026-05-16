"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, getDocs, addDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Vehicle } from "@/lib/types";
import Link from "next/link";
import { seedVehicles } from "@/lib/seedData";
import { Phone, CarFront, Bike, Users, Fuel, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export default function HomePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filter, setFilter] = useState<"car" | "bike">("car");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const q = query(
      collection(db, "vehicles"),
      where("status", "in", ["available", "on-road"]), // Only show available or currently on-road vehicles
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        clearTimeout(timeoutId);
        const v = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Vehicle,
        );
        setVehicles(v);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        clearTimeout(timeoutId);
        setLoading(false);
      },
    );

    // Fallback if Firestore completely hangs (e.g., db not created)
    timeoutId = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  // Use seed data as fallback
  const displayVehicles = vehicles.length > 0 ? vehicles : seedVehicles;
  const filteredVehicles = displayVehicles.filter((v) => v.type === filter);

  return (
    <div className="min-h-screen bg-neutral-50 font-sans pb-20">
      {/* Header */}
      <header className="bg-black/95 backdrop-blur-md text-white p-4 sticky top-0 z-50 border-b border-neutral-800 flex justify-between items-center transition-all">
        <div className="flex items-center">
          {/* Logo placeholder - assuming logo.png will be placed in public by user since it was attached */}
          <img
            src="/logo.png"
            alt="Amma Travels Logo"
            className="h-10 object-contain md:h-12"
            onError={(e) => {
              // Fallback if logo not yet uploaded
              e.currentTarget.style.display = "none";
              const fallback = document.getElementById("logo-fallback");
              if (fallback) fallback.style.display = "block";
            }}
          />
          <div id="logo-fallback" className="hidden">
            <h1 className="text-xl md:text-2xl font-black italic tracking-tighter text-red-500 font-heading">
              AMMA TRAVELS
            </h1>
            <p className="text-[10px] md:text-xs font-semibold tracking-widest text-white -mt-1">
              KAKINADA
            </p>
          </div>
        </div>
        <a
          href="tel:9652520222"
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-full font-bold shadow-lg shadow-red-600/30 transition-transform hover:scale-105 active:scale-95 text-sm md:text-base"
        >
          <Phone size={18} className="animate-pulse" />
          <span className="hidden sm:inline">Call Now</span>
        </a>
      </header>

      {/* Hero Section */}
      <section className="relative bg-white border-b border-neutral-200 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="max-w-5xl mx-auto px-4 py-16 md:py-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto px-4 sm:px-6"
          >
            <h2 className="text-4xl md:text-6xl font-black text-neutral-900 mb-4 md:mb-6 tracking-tight font-heading leading-tight">
              Explore Kakinada on{" "}
              <span className="text-red-600 block sm:inline">Your Terms.</span>
            </h2>
            <p className="text-base md:text-lg text-neutral-500 mb-8 md:mb-10 leading-relaxed px-2">
              Premium self-drive cars and well-maintained bikes available for
              daily & hourly rentals. Fast booking, zero hassle.
            </p>

            {/* Filter Toggle */}
            <div className="flex bg-neutral-100/80 backdrop-blur-sm p-1.5 rounded-2xl max-w-sm mx-auto shadow-sm border border-neutral-200/60 transition-all">
              <button
                onClick={() => setFilter("car")}
                className={`flex-1 flex justify-center items-center gap-2 py-3.5 rounded-xl font-bold transition-all ${filter === "car" ? "bg-white text-red-600 shadow-md shadow-neutral-200/50 scale-[1.02]" : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/50"}`}
              >
                <CarFront size={20} />
                Cars
              </button>
              <button
                onClick={() => setFilter("bike")}
                className={`flex-1 flex justify-center items-center gap-2 py-3.5 rounded-xl font-bold transition-all ${filter === "bike" ? "bg-white text-red-600 shadow-md shadow-neutral-200/50 scale-[1.02]" : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/50"}`}
              >
                <Bike size={20} />
                Bikes
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Vehicle List */}
      <main className="px-4 py-12 max-w-6xl mx-auto min-h-[50vh]">
        <div className="flex justify-between items-end mb-8 pl-1">
          <div>
            <h3 className="text-2xl font-black text-neutral-900 font-heading">
              Available {filter === "car" ? "Cars" : "Bikes"}
            </h3>
            <p className="text-neutral-500 font-medium mt-1">
              Choose your perfect ride below.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin shadow-lg"></div>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 bg-white rounded-3xl border border-neutral-100 shadow-sm"
          >
            <div className="w-24 h-24 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6">
              {filter === "car" ? (
                <CarFront size={40} className="text-neutral-300" />
              ) : (
                <Bike size={40} className="text-neutral-300" />
              )}
            </div>
            <h4 className="text-xl font-bold text-neutral-800 mb-2 font-heading">
              No {filter}s available
            </h4>
            <p className="text-neutral-500 max-w-sm mx-auto">
              All our {filter}s are currently booked or in maintenance. Check
              back soon!
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.1 },
              },
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          >
            {filteredVehicles.map((vehicle) => (
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 },
                }}
                key={vehicle.id}
                className="group bg-white rounded-2xl md:rounded-3xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col hover:shadow-xl hover:border-red-200 transition-all duration-300"
              >
                <div className="aspect-[4/3] bg-neutral-100 relative overflow-hidden group/slider">
                  {vehicle.images && vehicle.images.length > 0 ? (
                    <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {vehicle.images.map((img, i) => (
                        <div key={i} className="min-w-full h-full snap-center relative">
                          <img
                            src={img}
                            alt={`${vehicle.name} - ${i + 1}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      ))}
                      {vehicle.images.length > 1 && (
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
                           {vehicle.images.map((_, i) => (
                             <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/70 shadow-sm"></div>
                           ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-300 bg-neutral-50">
                      {vehicle.type === "car" ? (
                        <CarFront size={64} opacity={0.5} />
                      ) : (
                        <Bike size={64} opacity={0.5} />
                      )}
                    </div>
                  )}
                  {vehicle.status === "on-road" && (
                    <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                      Currently Rented
                    </div>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-black text-neutral-900 font-heading leading-tight group-hover:text-red-700 transition-colors">
                        {vehicle.name}
                      </h3>
                      <p className="text-sm font-medium text-neutral-500 mt-1">
                        {vehicle.model} • {vehicle.year}
                      </p>
                    </div>
                    {vehicle.pricingTiers &&
                      vehicle.pricingTiers.length > 0 && (
                        <div className="text-right shrink-0 ml-4">
                          <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest">
                            Starts At
                          </span>
                          <div className="text-xl font-black text-red-600">
                            ₹
                            {Math.min(
                              ...vehicle.pricingTiers.map((t) => t.price),
                            )}
                          </div>
                        </div>
                      )}
                  </div>

                  <div className="flex gap-3 mb-6 text-sm text-neutral-600 border-t border-neutral-100 pt-5 mt-auto">
                    <div className="flex items-center gap-1.5 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100">
                      <Fuel size={14} className="text-red-500" />
                      <span className="capitalize font-medium">
                        {vehicle.fuelType || "Petrol"}
                      </span>
                    </div>
                    {vehicle.type === "car" && (
                      <div className="flex items-center gap-1.5 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100">
                        <Users size={14} className="text-red-500" />
                        <span className="font-medium">
                          {vehicle.capacity || 5} Seats
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Link
                      href={`/vehicle/${vehicle.id}`}
                      className={`relative w-full py-3.5 rounded-xl font-bold text-center transition-all flex items-center justify-center gap-2 overflow-hidden ${vehicle.status === "available" ? "bg-black text-white hover:bg-red-600 hover:shadow-lg hover:shadow-red-600/20 active:scale-[0.98]" : "bg-neutral-100 text-neutral-400 pointer-events-none"}`}
                    >
                      {vehicle.status === "available" ? (
                        <>
                          Book Now
                          <ArrowRight
                            size={18}
                            className="transition-transform group-hover:translate-x-1"
                          />
                        </>
                      ) : (
                        "Check Availability"
                      )}
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {/* Admin Link (Hidden in footer) */}
      <footer className="max-w-6xl mx-auto px-4 text-center py-12 border-t border-neutral-200 mt-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-neutral-400 text-sm font-medium">
            © {new Date().getFullYear()} Amma Travels. All rights reserved.
          </p>
          <Link
            href="/admin"
            className="text-neutral-400 hover:text-neutral-900 transition-colors text-sm font-semibold tracking-wide"
          >
            Admin Portal
          </Link>
        </div>
      </footer>
    </div>
  );
}
