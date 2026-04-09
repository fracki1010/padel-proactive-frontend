export const DashboardHeader = () => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/20">
          <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
            <div className="w-2 h-2 bg-black rounded-full" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">
            PADEXA Central
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_#ff7a00]" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              WhatsApp Sincronizado
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
