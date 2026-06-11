export const Button = ({ children, onClick, type = "button", variant = "primary", className = "", disabled=false, icon: Icon }) => {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    success: "bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/30",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30",
    dark: "bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-900/30",
    outline: "border-2 border-gray-200 text-gray-700 hover:border-gray-900 bg-white"
  };
  return (
    <button type={type} onClick={(e) => { if(type==='button') e.preventDefault(); if(onClick) onClick(e); }} disabled={disabled} 
      className={`flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 w-full ${variants[variant]} ${className}`}>
      {Icon && <Icon size={18} />} {children}
    </button>
  );
};

export const Input = ({ label, icon: Icon, helperText, ...props }) => (
  <div className="mb-4 text-left w-full">
    <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">{label}</label>
    <div className="relative">
      {Icon && <div className="absolute left-3.5 top-3.5 text-gray-400"><Icon size={20} /></div>}
      <input className={`w-full bg-gray-50 border-2 border-gray-200 focus:border-blue-500 rounded-xl py-3 px-4 ${Icon ? 'pl-11' : ''} outline-none transition-all`} {...props} />
    </div>
    {helperText && <p className="text-xs text-gray-500 mt-1 ml-1">{helperText}</p>}
  </div>
);

export const Select = ({ label, options, icon: Icon, helperText, ...props }) => (
  <div className="mb-4 text-left w-full">
    <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">{label}</label>
    <div className="relative">
      {Icon && <div className="absolute left-3.5 top-3.5 text-gray-400"><Icon size={20} /></div>}
      <select className={`w-full bg-gray-50 border-2 border-gray-200 focus:border-blue-500 rounded-xl py-3 px-4 ${Icon ? 'pl-11' : ''} outline-none transition-all`} {...props}>
        <option value="">Seleccione...</option>
        {options.map(opt => <option key={opt.id || opt} value={opt.id || opt}>{opt.nombre || opt.label || opt}</option>)}
      </select>
    </div>
    {helperText && <p className="text-xs text-gray-500 mt-1 ml-1">{helperText}</p>}
  </div>
);

export const ProgressBar = ({ completados, total }) => {
  const pct = total > 0 ? Math.round((completados / total) * 100) : 0;
  return (
    <div className="w-full mt-3">
       <div className="flex justify-between text-xs font-black text-gray-500 mb-1">
         <span className="uppercase tracking-wider">Progreso</span><span className="text-blue-600">{pct}%</span>
       </div>
       <div className="w-full bg-gray-200 rounded-full h-2">
         <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{width: `${pct}%`}}></div>
       </div>
    </div>
  );
};

export const Spinner = ({ message = 'Cargando...' }) => (
  <div className="min-h-screen flex items-center justify-center p-5 bg-white">
    <div className="text-center">
      <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
      <p className="text-base font-bold text-gray-700">{message}</p>
    </div>
  </div>
);
