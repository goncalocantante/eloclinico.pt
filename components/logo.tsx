import { Sprout } from "lucide-react";

const Logo = ({
  size = 32,
  fontSize = 64,
}: {
  size?: number;
  fontSize?: number;
}) => {
  return (
    <div className="flex items-center gap-2">
      <Sprout
        className={`w-${size} h-${size} text-slate-600 rotate-[-45deg]`}
        strokeWidth={2.5}
      />
      <span
        className={`text-[${fontSize}px] font-bold tracking-tight text-slate-800`}
      >
        elo
      </span>
    </div>
  );
};

export default Logo;
