"use client";

import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { ShieldAlert, LogOut, ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import LoadingIndicator from "@/components/LoadingIndicator";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && !user.isAnonymous) {
        try {
          const docRef = doc(db, "admins", user.uid);
          const adminDoc = await getDoc(docRef);
          
          const isAuthorizedEmail = user.email === "7780763121@ammatravels.com" || 
                                   user.email === "mrlucifer1466@gmail.com" ||
                                   user.email?.endsWith("@ammatravels.com");

          if (adminDoc.exists() || (user.email === "mrlucifer1466@gmail.com")) {
            setIsAdmin(true);
            if (!adminDoc.exists() && isAuthorizedEmail) {
                // Background attempt to create doc
                setDoc(docRef, { 
                  email: user.email, 
                  role: "admin",
                  createdAt: new Date().toISOString() 
                }).catch(e => console.error("Admin bootstrap error:", e));
            }
          } else {
            if (isAuthorizedEmail) {
              console.log("Creating admin doc for:", user.email);
              await setDoc(docRef, { 
                email: user.email, 
                role: "admin",
                createdAt: new Date().toISOString() 
              });
              setIsAdmin(true);
            } else {
              console.warn("Unauthorized admin access attempt:", user.email);
              setIsAdmin(false);
            }
          }
        } catch (error: any) {
          console.error("Critical error in AdminLayout admin check:", error);
          setLoginError(`Admin verification failed: ${error.message || "Unknown error"}`);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsSubmitting(true);

    if (phone === "7780763121" && password === "satya@123") {
      const pseudoEmail = `${phone}@ammatravels.com`;
      try {
        await signInWithEmailAndPassword(auth, pseudoEmail, password);
      } catch (err: any) {
        if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential" || err.code === "auth/invalid-login-credentials") {
          try {
            const userCred = await createUserWithEmailAndPassword(auth, pseudoEmail, password);
            await setDoc(doc(db, "admins", userCred.user.uid), { email: pseudoEmail, role: "admin" });
            setIsAdmin(true);
          } catch (createErr: any) {
            console.error("Admin setup/create error:", createErr);
            setLoginError(`Setup Error: ${createErr.message || "Failed to create admin user."}. Ensure Email/Password Auth is enabled in Firebase Console.`);
          }
        } else {
          setLoginError(err.message || "Login failed.");
        }
      }
    } else {
      setLoginError("Invalid phone number or password.");
    }
    setIsSubmitting(false);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingIndicator isLoading={true} />
      </div>
    );

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4 relative">
        <Link href="/" className="absolute top-8 left-8 text-neutral-500 hover:text-black flex items-center gap-2 font-medium transition cursor-pointer">
          <ArrowLeft size={20} /> Back to Home
        </Link>
        <div className="bg-white p-8 border rounded-lg shadow-sm max-w-sm w-full text-center">
          <ShieldAlert size={48} className="mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2">Admin Portal</h1>
          <p className="text-neutral-500 mb-6">Restricted access area.</p>
          {loginError && <div className="text-sm text-red-600 mb-4 bg-red-50 p-3 rounded-lg border border-red-100">{loginError}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="tel"
                placeholder="Phone Number"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
              />
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-neutral-400 hover:text-black"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-neutral-800 transition disabled:opacity-50"
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
        <LoadingIndicator isLoading={isSubmitting} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-black text-white p-6 flex flex-col shrink-0 md:min-h-screen">
        <div className="mb-8">
          <Image
            src="/logo.png"
            alt="Amma Travels Logo"
            width={160}
            height={80}
            className="h-20 w-auto object-contain mb-2"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = "none";
              const fallback = document.getElementById("admin-logo-fallback");
              if (fallback) fallback.style.display = "block";
            }}
          />
          <div id="admin-logo-fallback" className="hidden">
            <h1 className="text-2xl font-black italic tracking-tighter text-red-500">
              AMMA TRAVELS
            </h1>
          </div>
          <span className="text-sm opacity-50 block tracking-normal">
            Control Center
          </span>
        </div>

        <nav className="flex-1 space-y-2 font-medium">
          <Link
            href="/admin"
            className="block px-4 py-3 rounded bg-white/10 hover:bg-white/20 transition"
          >
            Admin Dashboard
          </Link>
        </nav>

        <button
          onClick={() => signOut(auth)}
          className="mt-8 flex items-center gap-2 text-neutral-400 hover:text-white transition"
        >
          <LogOut size={18} /> Sign Out
        </button>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto h-screen">
        {children}
      </main>
    </div>
  );
}
