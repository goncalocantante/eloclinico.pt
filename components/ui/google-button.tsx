import * as React from "react";

import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth/client";

type GoogleButtonProps = React.ComponentProps<"button"> & {
  label?: string;
};

function GoogleButton({
  label = "Continue with Google",
  className,
  ...props
}: GoogleButtonProps) {
  const signIn = async (event: React.MouseEvent<HTMLButtonElement>) => {
    props.onClick?.(event);
    if (event.defaultPrevented) {
      return;
    }

    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard/calendar/week-view",
    });
  };

  return (
    <button
      type="button"
      aria-label={label}
      onClick={signIn}
      className={
        (cn(
          "w-full inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        ),
        className)
      }
      //   className={cn(
      //     // "inline-flex w-full items-center justify-center rounded-full border border-[#888] bg-white text-[#444] shadow-sm shadow-gray-400/50 transition hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285f4]/60 focus-visible:ring-offset-2 font-['Roboto']",
      //     "inline-flex w-full items-center justify-center rounded-full border border-[#888] bg-white text-[#444] shadow-sm shadow-gray-400/50 transition hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285f4]/60 focus-visible:ring-offset-2 font-['Roboto']",
      //     className
      //   )}
      {...props}
    >
      <span className="flex h-[42px] w-[42px] items-center justify-center">
        <svg
          viewBox="0 0 18 18"
          aria-hidden="true"
          className="size-5"
          fill="none"
        >
          <path
            d="M17.64 9.2c0-.64-.06-1.25-.18-1.84H9v3.48h4.86a4.16 4.16 0 0 1-1.8 2.73v2.27h2.91c1.7-1.56 2.67-3.86 2.67-6.64Z"
            fill="#4285F4"
          />
          <path
            d="M9 18c2.43 0 4.47-.8 5.96-2.16l-2.91-2.27c-.81.54-1.85.86-3.05.86-2.35 0-4.34-1.58-5.05-3.71H.9v2.33A8.99 8.99 0 0 0 9 18Z"
            fill="#34A853"
          />
          <path
            d="M3.95 10.72a5.4 5.4 0 0 1 0-3.45V4.94H.9a9 9 0 0 0 0 8.12l3.05-2.34Z"
            fill="#FBBC05"
          />
          <path
            d="M9 3.54c1.32 0 2.5.45 3.43 1.33l2.57-2.57C13.46.88 11.42 0 9 0A8.99 8.99 0 0 0 .9 4.94l3.05 2.33C4.66 5.11 6.65 3.54 9 3.54Z"
            fill="#EA4335"
          />
        </svg>
      </span>
      <span className="pl-3 text-left text-[14px] font-bold tracking-tight">
        {label}
      </span>
    </button>
  );
}

export { GoogleButton };
