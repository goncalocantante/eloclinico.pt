"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleButton } from "@/components/ui/google-button";
import Logo from "@/components/logo";
import { authClient } from "@/lib/auth/client";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { DEMO_USER_EMAIL, DEMO_USER_PASSWORD } from "@/constants";

export function Login({ mode = "signin" }: { mode?: "signin" | "signup" }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get("redirect");
  const priceId = searchParams.get("priceId");
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    await authClient.signIn.email({
      email: DEMO_USER_EMAIL,
      password: DEMO_USER_PASSWORD,
    }, {
      onSuccess: () => {
        router.push("/dashboard");
      },
      onError: (ctx) => {
        toast.error(ctx.error.message);
        setIsDemoLoading(false);
      }
    });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo size={144} fontSize={64} />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {mode === "signin"
            ? "Iniciar sessão na sua conta"
            : "Criar a sua conta"}
        </h2>
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <GoogleButton />

        <button
          onClick={handleDemoLogin}
          disabled={isDemoLoading}
          className="w-full flex justify-center items-center gap-2 py-2 px-4 mb-6 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDemoLoading ? (
            <Loader2 className="animate-spin size-4" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
          )}
          Entrar com conta Demo
        </button>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                {mode === "signin"
                  ? "Novo na nossa plataforma?"
                  : "Já tem uma conta?"}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href={`${mode === "signin" ? "/sign-up" : "/sign-in"}${redirect ? `?redirect=${redirect}` : ""
                }${priceId ? `&priceId=${priceId}` : ""}`}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              {mode === "signin"
                ? "Criar uma conta"
                : "Iniciar sessão em conta existente"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
