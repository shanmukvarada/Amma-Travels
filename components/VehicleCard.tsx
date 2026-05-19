'use client';

import Image from "next/image";
import { useState } from "react";
import { Vehicle } from "@/lib/types";
import Link from "next/link";
import { User } from "firebase/auth";
import { Users, Fuel, ArrowRight, ChevronLeft, ChevronRight, CarFront, Bike, ImageOff, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface VehicleCardProps {
  vehicle: Vehicle;
  user: User | null;
  onSignIn: () => void;
}

export default function VehicleCard({ vehicle, user, onSignIn }: VehicleCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});

  const filteredImages = (vehicle.images || []).filter(url => 
    url && !url.includes("photo-1534645229-ea21be3e46c9")
  );

  const handleBookClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      onSignIn();
    }
  };

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (filteredImages.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % filteredImages.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (filteredImages.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
    }
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
      }}
      className="group bg-white rounded-2xl md:rounded-3xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col hover:shadow-xl hover:border-red-200 transition-all duration-300"
    >
      <div className="aspect-[4/3] bg-neutral-100 relative overflow-hidden group/slider">
        {filteredImages.length > 0 && !imgError[currentImageIndex] ? (
          <div className="relative w-full h-full">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full"
              >
                <Image
                  src={filteredImages[currentImageIndex]}
                  alt={`${vehicle.name} - ${currentImageIndex + 1}`}
                  fill
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(prev => ({ ...prev, [currentImageIndex]: true }))}
                />
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            {filteredImages.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover/slider:opacity-100 transition-opacity hover:bg-black/50 z-20 shadow-sm"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover/slider:opacity-100 transition-opacity hover:bg-black/50 z-20 shadow-sm"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}

            {filteredImages.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
                {filteredImages.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${i === currentImageIndex ? 'w-4 bg-red-600' : 'w-1.5 bg-white/70'}`}
                  ></div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-300 bg-neutral-50 gap-2">
            {vehicle.type === "car" ? (
              <CarFront size={48} opacity={0.5} />
            ) : (
              <Bike size={48} opacity={0.5} />
            )}
            {vehicle.images && vehicle.images.length > 0 && (
              <div className="flex items-center gap-1 text-[10px] uppercase font-black opacity-40">
                <ImageOff size={12} /> Image Error
              </div>
            )}
          </div>
        )}
        {vehicle.status === "on-road" && (
          <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-10">
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
          {vehicle.pricingTiers && vehicle.pricingTiers.length > 0 && (
            <div className="text-right shrink-0 ml-4">
              <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest">
                Starts At
              </span>
              <div className="text-xl font-black text-red-600">
                ₹{Math.min(...vehicle.pricingTiers.map((t) => t.price))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mb-6 text-sm text-neutral-600 border-t border-neutral-100 pt-5 mt-auto">
          <div className="flex items-center gap-1.5 bg-neutral-50 px-2.5 py-1.5 rounded-lg border border-neutral-100">
            <Fuel size={12} className="text-red-500" />
            <span className="capitalize font-medium text-xs">
              {vehicle.fuelType || "Petrol"}
            </span>
          </div>
          {vehicle.type === "car" && (
            <div className="flex items-center gap-1.5 bg-neutral-50 px-2.5 py-1.5 rounded-lg border border-neutral-100">
              <Users size={12} className="text-red-500" />
              <span className="font-medium text-xs">
                {vehicle.capacity || 5} Seats
              </span>
            </div>
          )}
        </div>

        <div>
          <Link
            href={`/vehicle/${vehicle.id}`}
            onClick={handleBookClick}
            className={`relative w-full py-3.5 rounded-xl font-bold text-center transition-all flex items-center justify-center gap-2 overflow-hidden ${
              vehicle.status === "available" 
                ? (user ? "bg-black text-white hover:bg-red-600" : "bg-red-600 text-white hover:bg-red-700") 
                : "bg-neutral-100 text-neutral-400 pointer-events-none"
            } shadow-sm hover:shadow-md active:scale-[0.98]`}
          >
            {vehicle.status === "available" ? (
              <>
                {!user && <Lock size={14} className="animate-pulse" />}
                {user ? "Book Now" : "Sign in to Book"}
                <ArrowRight
                  size={16}
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
  );
}
