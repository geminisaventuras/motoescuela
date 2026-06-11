import { useContext, lazy, Suspense } from 'react';
import { AppProvider } from './context/AppContext';
import { AppContext } from './context/AppContextValue';
const InscripcionView = lazy(() => import('./views/InscripcionView').then(module => ({ default: module.InscripcionView })));
const PortalEstudiante = lazy(() => import('./views/PortalEstudiante').then(module => ({ default: module.PortalEstudiante })));
const LoginView = lazy(() => import('./views/LoginView').then(module => ({ default: module.LoginView })));
const DashboardView = lazy(() => import('./admin/DashboardView').then(module => ({ default: module.DashboardView })));
const InstructorPanel = lazy(() => import('./admin/DashboardView').then(module => ({ default: module.InstructorPanel })));
const ProveedorPanel = lazy(() => import('./admin/DashboardView').then(module => ({ default: module.ProveedorPanel })));
import { Zap, Calendar, User, Lock, ArrowRight, LogOut, AlertCircle, Check } from 'lucide-react';

const MainContainer = () => {
  const { view, setView, user, setUser, toast } = useContext(AppContext);

  return (
    <div className="min-h-screen bg-gray-200 flex justify-center font-sans">
      <div className="w-full max-w-md bg-white min-h-screen relative shadow-2xl flex flex-col overflow-x-hidden">

        {toast && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-2 fade-in w-max max-w-[90%]">
             <div className={`text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-bold ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
               {toast.type === 'error' ? <AlertCircle size={16}/> : <Check size={16}/>} {toast.msg}
             </div>
          </div>
        )}

        {view === 'inscripcion' && (
          <Suspense fallback={<div className="p-5">Cargando inscripción...</div>}>
            <InscripcionView />
          </Suspense>
        )}
        {view === 'portal' && (
          <Suspense fallback={<div className="p-5">Cargando portal...</div>}>
            <PortalEstudiante />
          </Suspense>
        )}
        {view === 'login' && (
          <Suspense fallback={<div className="p-5">Cargando acceso...</div>}>
            <LoginView />
          </Suspense>
        )}

        {view === 'dashboard' && user && (
          <div className="flex flex-col h-full relative min-h-screen bg-gray-50">
            <div className="bg-gray-900 text-white p-5 rounded-b-[2rem] shadow-lg sticky top-0 z-20">
              <div className="flex justify-between items-center">
                <div><h1 className="font-black text-lg uppercase leading-none">{user.role==='admin'?'Admin Panel':'Mi Portal'}</h1><p className="text-gray-400 text-xs">{user.data.nombre} ({user.role})</p></div>
                <button type="button" onClick={() => {setUser(null); setView('home');}} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"><LogOut size={18} /></button>
              </div>
            </div>

            {user.role === 'admin' && (
              <Suspense fallback={<div className="p-5 flex-1">Cargando panel administrativo...</div>}>
                <DashboardView />
              </Suspense>
            )}
            {user.role === 'instructor' && (
              <Suspense fallback={<div className="p-5 flex-1">Cargando panel de instructor...</div>}>
                <InstructorPanel />
              </Suspense>
            )}
            {user.role === 'proveedor' && (
              <Suspense fallback={<div className="p-5 flex-1">Cargando panel de proveedor...</div>}>
                <ProveedorPanel />
              </Suspense>
            )}
          </div>
        )}

        {view === 'home' && (
          <>
            <div className="bg-gray-900 text-white pt-16 pb-20 px-6 rounded-b-[3rem] relative overflow-hidden">
              <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply blur-3xl opacity-30"></div>
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl transform rotate-12"><Zap size={40} className="text-orange-400 transform -rotate-12" /></div>
                <h1 className="text-4xl font-black uppercase tracking-tight mb-2">Moto<span className="text-blue-500">Escuela</span></h1>
                <p className="text-gray-400 font-medium px-4">Plataforma Integral de Gestión y Aprendizaje.</p>
              </div>
            </div>

            <div className="flex-1 p-6 -mt-10 relative z-20 space-y-4">
              <button type="button" onClick={() => setView('inscripcion')} className="w-full bg-blue-600 text-white p-5 rounded-3xl shadow-xl shadow-blue-600/30 flex items-center justify-between group">
                <div className="text-left"><h3 className="font-black text-xl mb-1 flex items-center gap-2"><Calendar size={20} /> Inscribirse</h3><p className="text-blue-200 text-xs font-medium">Reserva curso y bloque.</p></div>
                <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setView('portal')} className="bg-gray-50 border-2 border-gray-100 p-5 rounded-3xl flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm"><User size={24} className="text-gray-700" /></div>
                  <span className="font-bold text-gray-900 text-sm text-center">Portal de<br/>Estudiantes</span>
                </button>
                <button type="button" onClick={() => setView('login')} className="bg-gray-50 border-2 border-gray-100 p-5 rounded-3xl flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm"><Lock size={24} className="text-gray-700" /></div>
                  <span className="font-bold text-gray-900 text-sm text-center">Acceso<br/>Privado</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContainer />
    </AppProvider>
  );
}
