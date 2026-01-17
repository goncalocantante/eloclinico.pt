import { BrainCircuit } from "lucide-react";

const Logo = ({
  size = 32,
  fontSize = 24,
}: {
  size?: number;
  fontSize?: number;
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-primary/10 p-1 rounded-lg">
        <BrainCircuit
          className={`w-6 h-6 text-primary`}
          strokeWidth={2.5}
        />
      </div>
      <span
        style={{ fontSize }}
        className="font-bold tracking-tight text-slate-900 dark:text-slate-100"
      >
        Elo
      </span>
    </div>
  );
};

export default Logo;
