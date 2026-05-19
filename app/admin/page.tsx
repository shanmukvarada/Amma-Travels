"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth, handleFirestoreError, OperationType } from "@/lib/firebase";
import { Booking, Vehicle, PricingTier } from "@/lib/types";
import { seedVehicles } from "@/lib/seedData";
import { formatDistanceToNow, format } from "date-fns";
import { FileImage, Phone, CheckCircle, XCircle, Plus, ShieldAlert, CheckCircle2, CarFront, Bike, Trash2 } from "lucide-react";
import Image from "next/image";
import LoadingIndicator from "@/components/LoadingIndicator";

export default function AdminDashboardPage() {
  // Booking state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Record<string, Vehicle>>({});
  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Return handling state
  const [returningBooking, setReturningBooking] = useState<Booking | null>(
    null,
  );
  const [finalKm, setFinalKm] = useState("");
  
  // Inventory state
  const [isEditing, setIsEditing] = useState<Vehicle | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    type: "car",
    status: "available",
    pricingTiers: [],
  });

  const [isAdminUser, setIsAdminUser] = useState<boolean | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [bootstrapStep, setBootstrapStep] = useState<string | null>(null);

  const isUsingSeedData = !isBootstrapping && vehiclesList.length === 0;
  const displayVehiclesList = (vehiclesList.length === 0 || isBootstrapping) ? seedVehicles : vehiclesList;

  useEffect(() => {
    // 1. Auth state check
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const email = user.email || "";
        // Check if exists in admins collection
        const adminDocRef = doc(db, "admins", user.uid);
        const adminSnap = await getDoc(adminDocRef);

        if (adminSnap.exists() || email === "mrlucifer1466@gmail.com") {
          setIsAdminUser(true);
          // If they were authenticated via email fallback but don't have a doc, create it
          if (!adminSnap.exists() && (email === "mrlucifer1466@gmail.com" || email.endsWith("@ammatravels.com"))) {
            try {
              await setDoc(adminDocRef, {
                email: email,
                role: "admin",
                createdAt: serverTimestamp(),
              });
              console.log("Admin doc bootstrapped for:", email);
            } catch (e) {
              console.error("Non-blocking bootstrap error:", e);
            }
          }
        } else {
          // If not exists and not the dev account, check if eligible
          if (email.endsWith("@ammatravels.com")) {
             try {
                await setDoc(adminDocRef, {
                  email: email,
                  role: "admin",
                  createdAt: serverTimestamp(),
                });
                setIsAdminUser(true);
             } catch (e) {
                console.error("Secondary bootstrap error:", e);
                setIsAdminUser(false);
             }
          } else {
            setIsAdminUser(false);
          }
        }
      } else {
        setIsAdminUser(null);
      }
    });

    // 2. Listen to active bookings
    let unsubscribe: (() => void) | undefined;
    let vunsub: (() => void) | undefined;

    if (isAdminUser === true) {
      const q = query(
        collection(db, "bookings"),
        where("status", "in", ["pending", "approved"]),
      );
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const b = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as Booking,
          );
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

      // Listen to all vehicles
      const vq = query(collection(db, "vehicles"));
      vunsub = onSnapshot(vq, (snapshot) => {
        const vMap: Record<string, Vehicle> = {};
        const vList: Vehicle[] = [];
        snapshot.forEach((doc) => {
          const v = { id: doc.id, ...doc.data() } as Vehicle;
          vMap[doc.id] = v;
          vList.push(v);
        });
        setVehicles(vMap);
        setVehiclesList(vList);
        setIsLoading(false);
      });
    }

    return () => {
      unsubscribeAuth();
      if (unsubscribe) unsubscribe();
      if (vunsub) vunsub();
    };
  }, [isAdminUser]);

  if (isAdminUser === null) return <LoadingIndicator isLoading={true} />;

  if (isAdminUser === false) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-8 text-center">
        <ShieldAlert size={64} className="text-red-600 mb-4" />
        <h1 className="text-3xl font-black mb-2 italic">Access Restricted</h1>
        <p className="text-neutral-500 max-w-md font-medium">
          You don&apos;t have administrative privileges. If you believe this is an error, please contact the developer or use your authorized company email.
        </p>
        <button onClick={() => window.location.href = "/"} className="mt-8 bg-black text-white px-8 py-3 rounded-xl font-bold">
          Back to Home
        </button>
      </div>
    );
  }

  // ... (Keep existing handleApprove, handleCompleteBooking functions)
    const handleApprove = async (b: Booking) => {
    try {
      if (!window.confirm("Approve this booking?")) return;
      await updateDoc(doc(db, "bookings", b.id), {
        status: "approved",
        startTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
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
      handleFirestoreError(e, OperationType.UPDATE, `bookings/${returningBooking.id}`);
    }
  };

  // ... (Keep existing Inventory handlers: openEdit, openCreate, etc.)
  const openEdit = (v: Vehicle) => {
    setIsEditing(v);
    setIsCreating(false);
    setFormData({ ...v });
  };
  const openCreate = () => {
    setIsEditing(null);
    setIsCreating(true);
    setFormData({
      type: "car",
      status: "available",
      pricingTiers: [],
      name: "",
      model: "",
      year: "",
      capacity: 5,
      fuelType: "petrol",
      registrationNumber: "",
      images: [],
    });
  };
  const closeForm = () => {
    setIsEditing(null);
    setIsCreating(false);
    setFormData({});
  };
  const handleTierAdd = () => {
    const newTiers = [
      ...(formData.pricingTiers || []),
      { durationHrs: 12, price: 0, kmLimit: 0, extraKmCharge: 0 },
    ];
    setFormData({ ...formData, pricingTiers: newTiers });
  };
  const handleTierChange = (index: number, key: keyof PricingTier, value: number) => {
    const newTiers = [...(formData.pricingTiers || [])];
    newTiers[index] = { ...newTiers[index], [key]: value };
    setFormData({ ...formData, pricingTiers: newTiers });
  };
  const handleTierRemove = (index: number) => {
    const newTiers = [...(formData.pricingTiers || [])];
    newTiers.splice(index, 1);
    setFormData({ ...formData, pricingTiers: newTiers });
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && isEditing.id) {
        const updatePayload = {
          type: formData.type || "",
          name: formData.name || "",
          model: formData.model || "",
          year: formData.year || "",
          capacity: formData.capacity || 0,
          fuelType: formData.fuelType || "petrol",
          registrationNumber: formData.registrationNumber || "",
          description: formData.description || "",
          images: formData.images || [],
          status: formData.status || "available",
          pricingTiers: formData.pricingTiers || [],
          updatedAt: serverTimestamp(),
        };
        await updateDoc(doc(db, "vehicles", isEditing.id), updatePayload);
      } else {
        const createPayload = {
          type: formData.type || "car",
          name: formData.name || "",
          model: formData.model || "",
          year: formData.year || "",
          capacity: formData.capacity || 0,
          fuelType: formData.fuelType || "petrol",
          registrationNumber: formData.registrationNumber || "",
          description: formData.description || "",
          images: formData.images || [],
          status: formData.status || "available",
          pricingTiers: formData.pricingTiers || [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await addDoc(collection(db, "vehicles"), createPayload);
      }
      closeForm();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "vehicles");
    }
  };
  const toggleMaintenance = async (v: Vehicle) => {
    try {
      const newStatus = v.status === "maintenance" ? "available" : "maintenance";
      await updateDoc(doc(db, "vehicles", v.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `vehicles/${v.id}`);
    }
  };
  const handleDeleteVehicle = async (id: string) => {
    if (!id) return;
    
    // If not already in confirmation state for this ID, set it
    if (deletingId !== id) {
      setDeletingId(id);
      // Optional: reset after some time if not confirmed
      setTimeout(() => {
        setDeletingId(prev => prev === id ? null : prev);
      }, 3000);
      return;
    }

    try {
      setIsLoading(true);
      await deleteDoc(doc(db, "vehicles", id));
      // Fallback log in case alert is blocked
      console.log("Vehicle deleted:", id);
    } catch (err) {
      console.error("Delete error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      alert("Failed to delete vehicle: " + msg);
    } finally {
      setIsLoading(false);
      setDeletingId(null);
    }
  };

  const handleBootstrap = async () => {
    // Stage 1: Confirmation
    if (bootstrapStep !== "confirm") {
      setBootstrapStep("confirm");
      setTimeout(() => setBootstrapStep(null), 5000);
      return;
    }

    setIsBootstrapping(true);
    setBootstrapStep("syncing");
    
    try {
      const { writeBatch, collection } = await import("firebase/firestore");
      const batch = writeBatch(db);
      
      // Check for existing vehicles to avoid duplicates (optional, but good)
      // For now we just sync all since it's a "Bootstrap" action
      
      for (const v of seedVehicles) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...data } = v;
        const newDocRef = doc(collection(db, "vehicles"));
        batch.set(newDocRef, {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      
      await batch.commit();
      console.log("Bootstrap complete: All seed vehicles synced to Firestore.");
      setBootstrapStep("complete");
      setTimeout(() => setBootstrapStep(null), 3000);
    } catch (err) {
      console.error("Bootstrap failed:", err);
      handleFirestoreError(err, OperationType.WRITE, "vehicles/bootstrap");
      setBootstrapStep(null);
    } finally {
      setIsBootstrapping(false);
    }
  };

  const pendingRequests = bookings.filter((b) => b.status === "pending");
  const onRoadRequests = bookings.filter((b) => b.status === "approved");

  return (
    <div className="space-y-12 pb-20">
      
      {/* SECTION: LIVE DASHBOARD */}
      <section className="space-y-8">
        <div>
          <h2 className="text-3xl font-black text-black mb-1">Live Operations</h2>
          <p className="text-neutral-500 font-medium">Monitor new requests and active fleet on the road.</p>
        </div>

        {pendingRequests.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-red-600">
              <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
              New Pending Requests ({pendingRequests.length})
            </h3>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {pendingRequests.map((b) => (
                <div key={b.id} className="bg-white p-5 border border-amber-200 rounded-2xl shadow-sm relative">
                  <div className="absolute top-0 right-0 bg-amber-100 text-amber-800 text-[10px] font-black px-3 py-1 rounded-bl-xl rounded-tr-xl">
                    PENDING
                  </div>
                  <h4 className="font-bold text-lg">{b.customerName}</h4>
                  <a href={`tel:${b.customerPhone}`} className="text-red-500 font-medium inline-flex items-center gap-1 mb-4 hover:underline">
                    <Phone size={14} /> {b.customerPhone}
                  </a>
                  <div className="bg-neutral-50 p-3 rounded-xl mb-4 text-sm border flex justify-between items-center">
                    <div>
                      <p className="font-bold text-neutral-900">{vehicles[b.vehicleId]?.name || "Unknown Vehicle"}</p>
                      <p className="text-neutral-500 font-medium">{b.selectedTier?.durationHrs}h Package • ₹{b.selectedTier?.price}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {b.aadhaarDoc && (
                      <a href={b.aadhaarDoc} target="_blank" rel="noreferrer" className="flex items-center justify-center py-2 px-3 bg-neutral-100 text-neutral-700 rounded-lg text-xs font-bold hover:bg-neutral-200">
                        <FileImage size={14} className="mr-2" /> Aadhaar
                      </a>
                    )}
                    {b.dlDoc && (
                      <a href={b.dlDoc} target="_blank" rel="noreferrer" className="flex items-center justify-center py-2 px-3 bg-neutral-100 text-neutral-700 rounded-lg text-xs font-bold hover:bg-neutral-200">
                        <FileImage size={14} className="mr-2" /> License
                      </a>
                    )}
                  </div>
                  <button onClick={() => handleApprove(b)} className="w-full bg-black text-white font-black py-3 rounded-xl hover:bg-neutral-800 transition flex items-center justify-center gap-2">
                    <CheckCircle size={18} /> Approve & Dispatch
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            Active on Road ({onRoadRequests.length})
          </h3>
          {onRoadRequests.length === 0 ? (
            <div className="p-12 border-2 border-dashed rounded-2xl text-center text-neutral-400 font-medium bg-white/50">
              No vehicles currently on the road.
            </div>
          ) : (
            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-neutral-50 text-neutral-600 font-bold border-b">
                  <tr>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Vehicle</th>
                    <th className="p-4">Started At</th>
                    <th className="p-4">Package</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {onRoadRequests.map((b) => (
                    <tr key={b.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-neutral-900">{b.customerName}</div>
                        <div className="text-neutral-500 font-medium text-xs">{b.customerPhone}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-neutral-900">{vehicles[b.vehicleId]?.name}</div>
                        <div className="text-neutral-500 font-medium text-xs">{vehicles[b.vehicleId]?.model}</div>
                      </td>
                      <td className="p-4 font-medium text-neutral-500">
                        {b.startTime?.seconds ? format(new Date(b.startTime.seconds * 1000), "MMM d, h:mm a") : "Just now"}
                      </td>
                      <td className="p-4 font-bold text-amber-600">
                        {b.selectedTier?.durationHrs}h ({b.selectedTier?.kmLimit}km)
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => setReturningBooking(b)} className="px-4 py-2 bg-neutral-900 text-white font-black rounded-lg hover:bg-neutral-800 text-xs shadow-sm shadow-neutral-200">
                          Complete Return
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* SECTION: FLEET INVENTORY */}
      <section className="space-y-8 border-t pt-12" id="inventory">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-3xl font-black text-black mb-1">Fleet Inventory</h2>
            <p className="text-neutral-500 font-medium">Manage vehicles, pricing tiers, and maintenance status.</p>
            {isUsingSeedData && (
              <div className="mt-2 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                <ShieldAlert size={14} className="text-amber-500" />
                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Currently Viewing Seed Data (Read Only)</p>
              </div>
            )}
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            {(isUsingSeedData || isBootstrapping || bootstrapStep) && (
              <button 
                onClick={handleBootstrap} 
                disabled={isBootstrapping}
                className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 ${
                  bootstrapStep === "confirm" ? "bg-amber-600 text-white shadow-amber-600/20 animate-pulse" :
                  bootstrapStep === "syncing" ? "bg-neutral-800 text-white" :
                  bootstrapStep === "complete" ? "bg-green-600 text-white" :
                  "bg-black text-white shadow-black/20 hover:bg-neutral-800"
                }`}
              >
                {bootstrapStep === "confirm" ? "Click to Confirm Sync" : 
                 bootstrapStep === "syncing" ? "Syncing Fleet..." :
                 bootstrapStep === "complete" ? "Synced Successfully!" :
                 "Sync All to Database"}
              </button>
            )}
            <button onClick={openCreate} className="flex-1 md:flex-none bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition flex items-center justify-center gap-2 shadow-lg shadow-red-600/20">
              <Plus size={20} /> Add New
            </button>
          </div>
        </div>

        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-neutral-50 text-neutral-600 font-bold border-b">
              <tr>
                <th className="p-4">Vehicle</th>
                <th className="p-4">Details</th>
                <th className="p-4">Pricing</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {displayVehiclesList.map((v) => (
                <tr key={v.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center shrink-0">
                        {v.type === "car" ? <CarFront size={20} /> : <Bike size={20} />}
                      </div>
                      <div>
                        <div className="font-bold text-base text-neutral-900">{v.name}</div>
                        <div className="text-neutral-500 text-xs font-medium">{v.model} • {v.year}</div>
                        {v.registrationNumber && (
                          <div className="text-[10px] font-black text-red-600 uppercase tracking-tighter mt-0.5">{v.registrationNumber}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-neutral-500 font-medium">
                    <div className="capitalize">{v.fuelType}</div>
                    <div className="text-xs">{v.capacity} Seats</div>
                  </td>
                  <td className="p-4 font-bold text-neutral-700">
                    <div className="max-w-[200px] truncate">
                      {v.pricingTiers?.map(t => `₹${t.price}`).join(", ")}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black
                        ${v.status === "available" ? "bg-green-100 text-green-700" : 
                          v.status === "maintenance" ? "bg-amber-100 text-amber-700" : 
                          "bg-blue-100 text-blue-700"}
                     `}>
                      <span className="capitalize">{v.status}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {!isUsingSeedData ? (
                            <>
                              <button onClick={() => toggleMaintenance(v)} disabled={v.status === "on-road"} className="text-xs font-bold text-neutral-500 hover:text-black disabled:opacity-30">
                                {v.status === "maintenance" ? "Available" : "Service"}
                              </button>
                              <button onClick={() => openEdit(v)} className="text-xs font-bold text-blue-600 hover:text-blue-800">
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteVehicle(v.id)} 
                                className={`text-xs font-bold transition-all ${deletingId === v.id ? 'bg-red-600 text-white px-2 py-1 rounded-lg animate-pulse' : 'text-red-600 hover:text-red-800'}`}
                              >
                                {deletingId === v.id ? 'Confirm?' : 'Delete'}
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest italic">Sync required to edit</span>
                          )}
                        </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODALS */}
      {returningBooking && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black italic">Complete Booking</h3>
              <button onClick={() => setReturningBooking(null)} className="text-neutral-400 hover:text-black">
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleCompleteBooking} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider mb-1 opacity-50">Final Odometer Reading (KM)</label>
                <input type="number" required value={finalKm} onChange={(e) => setFinalKm(e.target.value)} className="w-full p-2.5 border-2 border-neutral-100 rounded-xl focus:border-black outline-none font-bold text-sm" placeholder="e.g. 4500" />
              </div>
              <div className="p-4 bg-neutral-50 border-2 border-neutral-100 rounded-xl space-y-1">
                <div className="flex justify-between text-[10px] font-black uppercase opacity-40"><span>Booking Summary</span></div>
                <div className="flex justify-between text-xs font-bold"><span>Base Price</span><span>₹{returningBooking.selectedTier?.price}</span></div>
                <div className="flex justify-between text-xs font-bold"><span>KM Limit</span><span>{returningBooking.selectedTier?.kmLimit} KM</span></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setReturningBooking(null)} className="flex-1 py-3 bg-neutral-100 font-black rounded-xl hover:bg-neutral-200 uppercase tracking-widest text-[10px]">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-black text-white font-black rounded-xl hover:bg-neutral-800 uppercase tracking-widest text-[10px]">Finalize</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {(isEditing || isCreating) && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white p-4 rounded-3xl w-full max-w-xl shadow-2xl my-2">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-black italic">{isCreating ? "Add New Vehicle" : "Edit Vehicle"}</h3>
              <button onClick={closeForm} className="text-neutral-400 hover:text-black mt-[-4px]"><XCircle size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider mb-0.5 opacity-50">Type</label>
                  <select required value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as any})} className="w-full p-1.5 border-2 border-neutral-100 rounded-xl outline-none focus:border-black bg-white font-bold text-xs">
                    <option value="car">Car</option><option value="bike">Bike</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider mb-0.5 opacity-50">Display Name</label>
                  <input type="text" required value={formData.name || ""} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-1.5 border-2 border-neutral-100 rounded-xl outline-none focus:border-black font-bold text-xs" placeholder="Ex: Mahindra Thar" />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider mb-0.5 opacity-50">Model</label>
                  <input type="text" required value={formData.model || ""} onChange={(e) => setFormData({...formData, model: e.target.value})} className="w-full p-1.5 border-2 border-neutral-100 rounded-xl outline-none focus:border-black font-bold text-xs" placeholder="Ex: LX CRDe" />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider mb-0.5 opacity-50">Year</label>
                  <input type="text" required value={formData.year || ""} onChange={(e) => setFormData({...formData, year: e.target.value})} className="w-full p-1.5 border-2 border-neutral-100 rounded-xl outline-none focus:border-black font-bold text-xs" placeholder="Ex: 2023" />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider mb-0.5 opacity-50">Vehicle Number</label>
                  <input type="text" required value={formData.registrationNumber || ""} onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})} className="w-full p-1.5 border-2 border-neutral-100 rounded-xl outline-none focus:border-black font-bold text-xs" placeholder="Ex: AP 05 XX 0001" />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider mb-0.5 opacity-50">Fuel Type</label>
                  <select required value={formData.fuelType} onChange={(e) => setFormData({...formData, fuelType: e.target.value as any})} className="w-full p-1.5 border-2 border-neutral-100 rounded-xl outline-none focus:border-black bg-white font-bold text-xs">
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="ev">EV</option>
                    <option value="cng">CNG</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider mb-0.5 opacity-50">Capacity (Seats)</label>
                  <input type="number" required value={formData.capacity || ""} onChange={(e) => setFormData({...formData, capacity: Number(e.target.value)})} className="w-full p-1.5 border-2 border-neutral-100 rounded-xl outline-none focus:border-black font-bold text-xs" />
                </div>
                <div className="col-span-2">
                   <label className="block text-[9px] font-black uppercase tracking-wider mb-0.5 opacity-50">Images</label>
                   <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {formData.images?.map((url, i) => (
                        <div key={i} className="w-12 h-12 rounded-xl overflow-hidden relative border-2 border-neutral-100 group">
                          <Image src={url} alt="Vehicle" fill className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button 
                            type="button" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setFormData({
                                ...formData, 
                                images: (formData.images || []).filter((_, idx) => idx !== i)
                              });
                            }} 
                            className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-20"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      <div className="relative w-12 h-12 border-2 border-dashed border-neutral-200 rounded-xl flex items-center justify-center hover:border-black transition-colors cursor-pointer bg-neutral-50 group/mini-upload">
                        <input type="file" multiple accept="image/*" disabled={isUploading} onChange={async (e) => {
                          if (!e.target.files) return;
                          setIsUploading(true);
                          const newUrls = [...(formData.images || [])];
                          for (let i = 0; i < e.target.files.length; i++) {
                              const file = e.target.files[i];
                              const storageRef = ref(storage, `vehicles/${Date.now()}_${file.name}`);
                              await uploadBytes(storageRef, file);
                              const url = await getDownloadURL(storageRef);
                              newUrls.push(url);
                          }
                          setFormData({...formData, images: newUrls});
                          setIsUploading(false);
                        }} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        <Plus size={16} className={`${isUploading ? 'animate-spin text-red-500' : 'text-neutral-400 group-hover/mini-upload:text-black'}`} />
                      </div>
                   </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-black italic">Pricing Engine</h4>
                  <button type="button" onClick={handleTierAdd} className="bg-neutral-100 hover:bg-black hover:text-white px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors">
                    <Plus size={12} /> Add Bundle
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1.5 scrollbar-none">
                  {formData.pricingTiers?.map((tier, idx) => (
                    <div key={idx} className="bg-neutral-50 p-1.5 border-2 border-neutral-100 rounded-xl grid grid-cols-4 gap-2 relative pr-8">
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleTierRemove(idx);
                        }} 
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="space-y-0.5">
                        <span className="text-[7px] font-black tracking-widest opacity-30 block ml-0.5">HRS</span>
                        <input type="number" required value={tier.durationHrs} onChange={(e) => handleTierChange(idx, "durationHrs", Number(e.target.value))} className="w-full p-1 border border-neutral-200 rounded-md outline-none focus:border-black font-bold text-[11px] bg-white" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[7px] font-black tracking-widest opacity-30 block ml-0.5">PRICE</span>
                        <input type="number" required value={tier.price} onChange={(e) => handleTierChange(idx, "price", Number(e.target.value))} className="w-full p-1 border border-neutral-200 rounded-md outline-none focus:border-black font-bold text-[11px] bg-white" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[7px] font-black tracking-widest opacity-30 block ml-0.5">LIMIT</span>
                        <input type="number" required value={tier.kmLimit} onChange={(e) => handleTierChange(idx, "kmLimit", Number(e.target.value))} className="w-full p-1 border border-neutral-200 rounded-md outline-none focus:border-black font-bold text-[11px] bg-white" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[7px] font-black tracking-widest opacity-30 block ml-0.5">EXTRA</span>
                        <input type="number" required value={tier.extraKmCharge} onChange={(e) => handleTierChange(idx, "extraKmCharge", Number(e.target.value))} className="w-full p-1 border border-neutral-200 rounded-md outline-none focus:border-black font-bold text-[11px] bg-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t">
                <button type="button" onClick={closeForm} className="flex-1 py-2.5 bg-neutral-100 rounded-xl hover:bg-neutral-200 font-black uppercase tracking-widest text-[9px] transition-colors">Close</button>
                <button type="submit" className="flex-1 py-2.5 bg-black text-white rounded-xl hover:bg-neutral-800 font-black uppercase tracking-widest text-[9px] transition-colors">
                  {isCreating ? "Create Asset" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Loading Indicator */}
      <LoadingIndicator isLoading={isLoading || isUploading} />
    </div>
  );
}
