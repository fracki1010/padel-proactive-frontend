type SetupHeaderProps = {
  superAdminUsername: string;
};

export const SetupHeader = ({ superAdminUsername }: SetupHeaderProps) => {
  return (
    <div className="text-center space-y-2">
      <h1 className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter uppercase">
        Setup Inicial
      </h1>
      <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
        Bienvenido {superAdminUsername}. Configurá tu primer tenant.
      </p>
    </div>
  );
};
