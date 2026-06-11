import { useState, useContext } from 'react';
import { AppContext } from '../context/AppContextValue';
import { Button, Input } from '../components/UI';
import { ChevronLeft, Lock, Mail, AlertCircle } from 'lucide-react';

export const LoginView = () => {
  const { setUser, setView, showToast, instructores, proveedores } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === 'admin@escuela.com' && pwd === '123456') { 
        setUser({ role: 'admin', data: { nombre: 'Administrador' } }); 
        setView('dashboard'); 
        showToast('Bienvenido Admin'); 
        return; 
    }
    const inst = (instructores||[]).find(i => i.email === email && i.password === pwd);
    if (inst) { 
        if (!inst.activo) return showToast('Cuenta inhabilitada', 'error'); 
        setUser({ role: 'instructor', data: inst }); 
        setView('dashboard'); 
        showToast('Bienvenido Instructor'); 
        return; 
    }
    const prov = (proveedores||[]).find(p => p.email === email && p.password === pwd);
    if (prov) { 
        if (!prov.activo) return showToast('Cuenta inhabilitada', 'error'); 
        setUser({ role: 'proveedor', data: prov }); 
        setView('dashboard'); 
        showToast('Bienvenido Proveedor'); 
        return; 
    }
    showToast('Credenciales inválidas', 'error');
  };

  return (
    <div className="p-6 h-full flex flex-col justify-center min-h-screen bg-white">
      <button type="button" onClick={() => setView('home')} className="absolute top-6 left-6 p-2 bg-gray-100 rounded-full text-gray-500"><ChevronLeft size={24} /></button>
      <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center mb-6 shadow-xl mx-auto transform -rotate-6"><Lock size={36} className="text-white transform rotate-6" /></div>
      <h2 className="text-3xl font-black text-center text-gray-900 mb-2 uppercase tracking-tight">Acceso Privado</h2>
      <form onSubmit={handleLogin} className="mt-6">
        <Input label="Correo Electrónico" type="email" icon={Mail} value={email} onChange={e=>setEmail(e.target.value)} required />
        <Input label="Contraseña" type="password" icon={Lock} value={pwd} onChange={e=>setPwd(e.target.value)} required />
        <Button type="submit" variant="dark" className="mt-4">Ingresar al Sistema</Button>
      </form>
      <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 space-y-2 font-medium">
        <p className="font-bold text-sm mb-2 flex items-center gap-1"><AlertCircle size={16}/> Credenciales Pruebas</p>
        <p><b>Admin:</b> admin@escuela.com / 123456</p>
        <p><b>Instructor:</b> armando@motos.com / 123</p>
      </div>
    </div>
  );
};
