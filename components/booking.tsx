"use client";
import { BlinkBlur } from "react-loading-indicators";

const Booking = () => {
  return (
    <div className="flex items-center justify-center">
      <BlinkBlur
        color={["#32cd32", "#327fcd", "#cd32cd", "#cd8032"]}
        size="large"
        text="Booking Event, don't click on anything⛔⛔..."
        textColor="black"
      />
    </div>
  );
};

export default Booking;
