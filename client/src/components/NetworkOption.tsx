import { cn } from "@/lib/utils";

interface NetworkOptionProps {
  network: 'ethereum' | 'bsc';
  name: string;
  fee: string;
  color: 'blue' | 'yellow';
  selected: boolean;
  onSelect: () => void;
}

export default function NetworkOption({ 
  network, 
  name, 
  fee, 
  color, 
  selected, 
  onSelect 
}: NetworkOptionProps) {
  const colorClasses = {
    blue: {
      gradient: 'from-blue-400 to-blue-600',
      border: 'border-blue-400',
      text: 'text-blue-600'
    },
    yellow: {
      gradient: 'from-yellow-400 to-yellow-600', 
      border: 'border-yellow-400',
      text: 'text-yellow-600'
    }
  };

  const colorClass = colorClasses[color];

  return (
    <div 
      className={cn(
        "group p-6 bg-white rounded-2xl border-2 cursor-pointer transition-all duration-300",
        selected ? colorClass.border : "border-slate-200 hover:" + colorClass.border
      )}
      onClick={onSelect}
      data-testid={`network-option-${network}`}
    >
      <div className="flex items-center space-x-4">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-r",
          colorClass.gradient
        )}>
          <span className="text-white font-bold">
            {network === 'ethereum' ? 'ETH' : 'BSC'}
          </span>
        </div>
        <div className="text-left">
          <h3 className="font-semibold text-slate-800">{name}</h3>
          <p className="text-sm text-slate-600">
            Ücret: <span className={cn("font-bold", colorClass.text)}>{fee}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
