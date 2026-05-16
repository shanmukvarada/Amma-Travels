"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, handleFirestoreError, OperationType } from "@/lib/firebase";
import { Vehicle, PricingTier } from "@/lib/types";
import { Plus, ShieldAlert, CheckCircle2, CarFront, Bike, Trash2 } from "lucide-react";

export default function InventoryPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isEditing, setIsEditing] = useState<Vehicle | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    type: "car",
    status: "available",
    pricingTiers: [],
  });

  useEffect(() => {
    const q = query(collection(db, "vehicles"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const v = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Vehicle,
        );
        setVehicles(v);
        
        // Auto-seed if empty
        if (v.length === 0) {
            import("@/lib/seedData").then(({ seedVehicles }) => {
                seedVehicles.forEach(async (v) => {
                    const { id, ...rest } = v;
                    await addDoc(collection(db, "vehicles"), {
                        ...rest,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                    });
                })
            });
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "vehicles"),
    );

    return () => unsubscribe();
  }, []);

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

  const handleTierChange = (
    index: number,
    key: keyof PricingTier,
    value: number,
  ) => {
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
      const newStatus =
        v.status === "maintenance" ? "available" : "maintenance";
      await updateDoc(doc(db, "vehicles", v.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `vehicles/${v.id}`);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (confirm("Are you sure you want to delete this vehicle?")) {
      try {
        await deleteDoc(doc(db, "vehicles", id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `vehicles/${id}`);
      }
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black mb-1 text-black">
            Fleet Inventory
          </h2>
          <p className="text-neutral-500">
            Manage vehicles, pricing tiers, and maintenance status.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openCreate}
            className="bg-red-600 text-white px-5 py-3 rounded-lg font-bold hover:bg-red-700 transition flex items-center gap-2"
          >
            <Plus size={18} /> Add Vehicle
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b">
            <tr>
              <th className="p-4">Vehicle</th>
              <th className="p-4">Details</th>
              <th className="p-4">Pricing Packages</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {vehicles.map((v) => (
              <tr key={v.id} className="hover:bg-neutral-50/50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center shrink-0">
                      {v.type === "car" ? (
                        <CarFront size={20} />
                      ) : (
                        <Bike size={20} />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-base">{v.name}</div>
                      <div className="text-neutral-500 text-xs">
                        {v.model} • {v.year}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-neutral-500">
                  <div className="capitalize">{v.fuelType}</div>
                  <div className="text-xs">{v.capacity} Seats</div>
                </td>
                <td className="p-4">
                  <div className="max-w-[200px] overflow-hidden text-ellipsis">
                    {v.pricingTiers
                      ?.map((t) => `${t.durationHrs}h (₹${t.price})`)
                      .join(", ")}
                  </div>
                </td>
                <td className="p-4">
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold
                      ${
                        v.status === "available"
                          ? "bg-green-100 text-green-700"
                          : v.status === "maintenance"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                      }
                   `}
                  >
                    {v.status === "available" && <CheckCircle2 size={14} />}
                    {v.status === "maintenance" && <ShieldAlert size={14} />}
                    <span className="capitalize">{v.status}</span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => toggleMaintenance(v)}
                    disabled={v.status === "on-road"}
                    className="text-xs font-semibold text-neutral-500 hover:text-black mr-4 disabled:opacity-30"
                  >
                    {v.status === "maintenance"
                      ? "Mark Available"
                      : "Sent to Service"}
                  </button>
                  <button
                    onClick={() => openEdit(v)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteVehicle(v.id)}
                    className="text-xs font-semibold text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Editing / Creating Modal */}
      {(isEditing || isCreating) && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white p-4 rounded-2xl w-full max-w-xl shadow-2xl my-4 h-[600.037px]">
            <h3 className="text-2xl font-black mb-6">
              {isCreating ? "Add New Vehicle" : "Edit Vehicle"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-semibold mb-1">
                    Vehicle Type
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as any })
                    }
                    className="w-full p-3 border rounded-lg bg-white"
                  >
                    <option value="car">Car</option>
                    <option value="bike">Bike</option>
                  </select>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-semibold mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="e.g. Mahindra Thar 4x4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Model Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.model || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="e.g. LX CRDe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Year
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.year || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, year: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="e.g. 2023"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Fuel Type
                  </label>
                  <select
                    required
                    value={formData.fuelType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fuelType: e.target.value as any,
                      })
                    }
                    className="w-full p-3 border rounded-lg bg-white"
                  >
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="cng">CNG</option>
                    <option value="ev">EV</option>
                  </select>
                </div>
                {formData.type === 'car' && (
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Seating Capacity
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.capacity || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          capacity: Number(e.target.value),
                        })
                      }
                      className="w-full p-3 border rounded-lg"
                    />
                  </div>
                )}
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="Brief details about the vehicle"
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1">
                    Images
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                     {formData.images?.map((url, i) => (
                        <div key={i} className="w-16 h-16 rounded overflow-hidden relative border">
                            <img src={url} alt={`Vehicle ${i}`} className="w-full h-full object-cover"/>
                            <button type="button" onClick={() => setFormData({...formData, images: formData.images?.filter((_, idx) => idx !== i)})} className="absolute top-0 right-0 p-1 bg-black/50 text-white rounded-bl">×</button>
                        </div>
                     ))}
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={async (e) => {
                      if (!e.target.files) return;
                      const newUrls = [...(formData.images || [])];
                      for (let i = 0; i < e.target.files.length; i++) {
                          const file = e.target.files[i];
                          const storageRef = ref(storage, `vehicles/${Date.now()}_${file.name}`);
                          await uploadBytes(storageRef, file);
                          const url = await getDownloadURL(storageRef);
                          newUrls.push(url);
                      }
                      setFormData({...formData, images: newUrls});
                    }}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Upload images directly from your computer.</p>
                </div>
              </div>

              <hr />

              {/* Pricing Engine */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-bold">Pricing Packages</h4>
                  <button
                    type="button"
                    onClick={handleTierAdd}
                    className="text-sm font-bold text-red-600 flex items-center gap-1"
                  >
                    <Plus size={16} /> Add Package
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.pricingTiers?.map((tier, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3 border rounded-xl grid grid-cols-2 gap-2 relative pr-10"
                    >
                      <button
                        type="button"
                        onClick={() => handleTierRemove(idx)}
                        className="absolute right-3 top-3 text-neutral-400 hover:text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-500 mb-1">
                          Duration (Hrs)
                        </label>
                        <input
                          type="number"
                          required
                          value={tier.durationHrs}
                          onChange={(e) =>
                            handleTierChange(
                              idx,
                              "durationHrs",
                              Number(e.target.value),
                            )
                          }
                          className="w-full p-2 border rounded bg-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-500 mb-1">
                          Price (₹)
                        </label>
                        <input
                          type="number"
                          required
                          value={tier.price}
                          onChange={(e) =>
                            handleTierChange(
                              idx,
                              "price",
                              Number(e.target.value),
                            )
                          }
                          className="w-full p-2 border rounded bg-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-500 mb-1">
                          KM Limit
                        </label>
                        <input
                          type="number"
                          required
                          value={tier.kmLimit}
                          onChange={(e) =>
                            handleTierChange(
                              idx,
                              "kmLimit",
                              Number(e.target.value),
                            )
                          }
                          className="w-full p-2 border rounded bg-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-500 mb-1">
                          Extra KM (₹/KM)
                        </label>
                        <input
                          type="number"
                          required
                          value={tier.extraKmCharge}
                          onChange={(e) =>
                            handleTierChange(
                              idx,
                              "extraKmCharge",
                              Number(e.target.value),
                            )
                          }
                          className="w-full p-2 border rounded bg-white text-sm"
                        />
                      </div>
                    </div>
                  ))}
                  {(!formData.pricingTiers ||
                    formData.pricingTiers.length === 0) && (
                    <div className="text-sm text-neutral-500 italic py-2">
                      No pricing packages added. Customers won&apos;t be able to
                      book.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 py-3 bg-neutral-100 font-bold rounded-xl hover:bg-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-black text-white font-bold rounded-xl hover:bg-neutral-800"
                >
                  {isCreating ? "Create Vehicle" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
