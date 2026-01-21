"use client";

import { useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AuthUser } from "@/./lib/type";

interface GoogleJwtPayload {
  name: string;
  email: string;
  picture?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { user, setUser } = useAuth();

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">
        <h1 className="text-2xl font-semibold mb-2 text-center">
          Email Scheduler
        </h1>
        <p className="text-sm text-slate-400 mb-6 text-center">
          Sign in with Google to access your dashboard.
        </p>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={credentialResponse => {
              if (!credentialResponse.credential) return;
              const decoded = jwtDecode<GoogleJwtPayload>(
                credentialResponse.credential
              );

              const authUser: AuthUser = {
                name: decoded.name,
                email: decoded.email,
                picture: decoded.picture,
              };

              setUser(authUser);
              router.replace("/dashboard");
            }}
            onError={() => {
              alert("Login failed. Please try again.");
            }}
          />
        </div>
      </div>
    </div>
  );
}
