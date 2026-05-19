"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth, signInWithGoogle, logout } from "@/lib/firebase";
import { Vehicle } from "@/lib/types";
import { User, onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { seedVehicles } from "@/lib/seedData";
import { Phone, CarFront, Bike, Users, Fuel, ArrowRight, Instagram, ChevronLeft, ChevronRight, LogIn, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import LoadingIndicator from "@/components/LoadingIndicator";
import VehicleCard from "@/components/VehicleCard";

export default function HomePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filter, setFilter] = useState<"car" | "bike">("car");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currUser) => {
      setUser(currUser);
    });

    let timeoutId: NodeJS.Timeout;

    const q = query(
      collection(db, "vehicles"),
      where("status", "in", ["available", "on-road"]),
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

    timeoutId = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => {
      unsubscribe();
      unsubAuth();
      clearTimeout(timeoutId);
    };
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign in failed", error);
    }
  };

  const displayVehicles = vehicles.length > 0 ? vehicles : seedVehicles;
  const filteredVehicles = displayVehicles.filter((v) => v.type === filter);

  return (
    <div key="main-content" className="min-h-screen bg-neutral-50 font-sans pb-20 relative">
      {/* Header */}
      <header className="bg-black/95 backdrop-blur-md text-white p-4 relative z-50 border-b border-neutral-800 flex justify-between items-center transition-all h-[70.8px]">
        <div className="flex items-center">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Amma Travels Logo"
              width={160}
              height={80}
              className="h-16 w-auto object-contain md:h-20 cursor-pointer"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          </Link>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <AnimatePresence mode="wait">
            {!user ? (
              <motion.button
                key="signin"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={handleSignIn}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition-all text-sm font-bold border border-white/10"
              >
                <LogIn size={14} />
                <span className="hidden sm:inline">Sign In</span>
              </motion.button>
            ) : (
              <motion.div 
                key="user-info"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2 md:gap-3"
              >
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Logged In</span>
                  <span className="text-xs font-bold text-white max-w-[120px] truncate">{user.displayName || "User"}</span>
                </div>
                {user.photoURL && (
                  <Image 
                    src={user.photoURL} 
                    alt={user.displayName || "Profile"} 
                    width={32} 
                    height={32} 
                    className="rounded-full border border-white/20"
                  />
                )}
                <button 
                  onClick={() => logout()}
                  className="p-2 bg-white/10 hover:bg-red-600/20 text-white hover:text-red-400 rounded-full transition-all"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <a
            href="tel:9652520222"
            className="flex items-center gap-2 bg-red-600/80 backdrop-blur-sm text-white px-4 py-2 rounded-full shadow-lg shadow-red-600/20 transition-transform hover:scale-105 active:scale-95 group text-sm font-bold"
          >
            <Phone size={14} className="animate-pulse" />
            <span className="hidden xs:inline">Call Now</span>
          </a>
        </div>
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

            <AnimatePresence>
              {!user && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mb-10 p-6 bg-red-50 border border-red-100 rounded-3xl text-center shadow-sm"
                >
                  <h4 className="text-red-900 font-bold mb-2 flex items-center justify-center gap-2">
                    <Users size={18} className="text-red-500" />
                    Booking Requirement
                  </h4>
                  <p className="text-red-700/80 text-sm mb-4">
                    Please sign in with your Google account to view pricing and proceed with your booking.
                  </p>
                  <button
                    onClick={handleSignIn}
                    className="inline-flex items-center gap-2 bg-white text-neutral-900 px-6 py-3 rounded-2xl font-bold shadow-sm hover:shadow-md transition-all border border-neutral-200"
                  >
                    <Image src="/google-icon.png" alt="Google" width={20} height={20} className="w-5 h-5" onError={(e) => e.currentTarget.src = "https://www.google.com/favicon.ico"} />
                    Continue with Google
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Filter Toggle */}
            <div className="flex bg-neutral-100/80 backdrop-blur-sm p-1.5 rounded-2xl max-w-sm mx-auto shadow-sm border border-neutral-200/60 transition-all">
              <button
                onClick={() => setFilter("car")}
                className={`flex-1 flex justify-center items-center gap-2 py-3.5 rounded-xl font-bold transition-all ${filter === "car" ? "bg-white text-red-600 shadow-md shadow-neutral-200/50 scale-[1.02]" : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/50"}`}
              >
                <CarFront size={16} />
                Cars
              </button>
              <button
                onClick={() => setFilter("bike")}
                className={`flex-1 flex justify-center items-center gap-2 py-3.5 rounded-xl font-bold transition-all ${filter === "bike" ? "bg-white text-red-600 shadow-md shadow-neutral-200/50 scale-[1.02]" : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/50"}`}
              >
                <Bike size={16} />
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
          <div className="flex justify-center py-20 opacity-0"></div>
        ) : filteredVehicles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 bg-white rounded-3xl border border-neutral-100 shadow-sm"
          >
            <div className="w-24 h-24 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6">
              {filter === "car" ? (
                <CarFront size={32} className="text-neutral-300" />
              ) : (
                <Bike size={32} className="text-neutral-300" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filteredVehicles.map((vehicle) => (
                <VehicleCard 
                  key={vehicle.id} 
                  vehicle={vehicle} 
                  user={user}
                  onSignIn={handleSignIn}
                />
              ))}
            </div>
        )}
      </main>
      
      <LoadingIndicator isLoading={loading} />

      {/* Admin Link (Hidden in footer) */}
      <footer className="max-w-6xl mx-auto px-4 py-12 border-t border-neutral-200 mt-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="max-w-md text-left">
            <h4 className="text-sm font-black text-neutral-900 uppercase tracking-widest mb-3">Office Address</h4>
            <p className="text-neutral-500 text-sm leading-relaxed mb-6">
              Kakinada town railway station opp Kusuma hospitals, Ramarao peta kakinada
            </p>
            <a href="tel:9652520222" className="inline-flex items-center gap-2 text-red-600 font-bold hover:underline decoration-red-600/30 transition-all bg-red-50 px-3 py-1.5 rounded-xl text-sm">
              <Phone size={14} />
              <span>9652520222</span>
            </a>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
            <h4 className="text-sm font-black text-neutral-900 uppercase tracking-widest mb-1 md:mb-3">Follow us on instagram</h4>
            <a 
              href="https://www.instagram.com/ammatravels_kkd?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 text-red-600 hover:text-red-700 font-bold transition-all group bg-red-50/50 p-4 rounded-2xl md:bg-transparent md:p-0 border border-red-100 md:border-none"
            >
              <Instagram size={16} />
              <span className="group-hover:underline decoration-red-600/30">@ammatravels_kkd</span>
            </a>
          </div>
        </div>
        
        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-neutral-100 mt-12">
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
