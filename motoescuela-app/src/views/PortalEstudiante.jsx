import { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContextValue';
import { Button, Input, ProgressBar } from '../components/UI';
import { ChevronLeft, User, Hash, LogOut, AlertCircle, Check, Clock, Award } from 'lucide-react';

export const PortalEstudiante = () => {
  const { reservas, cursos, horarios, instructores, sedes, setView, showToast, autoLoginData, setAutoLoginData, saveReserva } = useContext(AppContext);
  const [ced, setCed] = useState('');
  const [enteredAlumnoId, setEnteredAlumnoId] = useState(null);

  const autoAlumnoId = useMemo(() => {
    if (!autoLoginData || !(reservas || []).length) return null;
    const found = reservas.find(r => String(r.cedula) === String(autoLoginData.cedula));
    return found ? found.id : null;
  }, [autoLoginData, reservas]);

  const alumnoId = enteredAlumnoId || autoAlumnoId;

  const loginEstudiante = (event) => {
    event.preventDefault();
    const records = (reservas||[]).filter(r => String(r.cedula) === String(ced));
    if (records.length > 0) {
      setEnteredAlumnoId(records[records.length-1].id);
    } else {
      showToast('Cédula no encontrada.', 'error');
    }
  };

  if(!alumnoId) {
    return (
      <div className="p-6 h-full flex flex-col justify-center bg-white min-h-screen">
        <button type="button" onClick={() => setView('home')} className="absolute top-6 left-6 p-2 bg-gray-100 rounded-full text-gray-500"><ChevronLeft size={24} /></button>
        <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mb-6 shadow-inner mx-auto transform rotate-6"><User size={36} className="text-blue-600 transform -rotate-6" /></div>
        <h2 className="text-2xl font-black text-center text-gray-900 mb-2">Portal Estudiante</h2>
        <p className="text-center text-gray-500 text-sm mb-8">Ingresa con tu cédula para ver tu progreso.</p>
        <form onSubmit={loginEstudiante}>
          <Input label="Cédula de Identidad" type="number" value={ced} onChange={e=>setCed(e.target.value)} icon={Hash} required/>
          <Button type="submit" className="mt-4">Ingresar a mi Portal</Button>
        </form>
      </div>
    );
  }

  const reservaActualizada = (reservas||[]).find(r => String(r.id) === String(alumnoId)) || autoLoginData;
  if(!reservaActualizada) return <div className="p-6">Cargando datos...</div>;

  const cursoAsignado = (cursos||[]).find(c => String(c.id) === String(reservaActualizada.cursoId)) || { nombre: 'Curso Básico', modulos: [] };
  const hor = (horarios||[]).find(h => String(h.id) === String(reservaActualizada.horaId));
  const inst = (instructores||[]).find(i => String(i.id) === String(reservaActualizada.instructorId));
  const cantCompletados = Object.keys(reservaActualizada.modulosEstado || {}).length;

  const horaInicio = hor?.label ? hor.label.split('-')[0]?.trim() : '--:--';
  const horaFin = hor?.label ? hor.label.split('-')[1]?.trim() : '--:--';

  return (
    <div className="p-5 pb-24 bg-gray-50 min-h-screen animate-in fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={() => {setEnteredAlumnoId(null); setAutoLoginData(null); setView('home');}} className="p-2 bg-white rounded-full shadow text-gray-500"><LogOut size={20} /></button>
        <h2 className="text-xl font-black text-gray-900 truncate">Hola, {reservaActualizada.nombre}</h2>
      </div>

      {reservaActualizada.estadoPago === 'Rechazado' && (
        <div className="bg-red-100 border border-red-200 p-4 rounded-2xl flex flex-col gap-3 mb-6 shadow-sm">
          <div className="flex gap-3 items-start">
            <AlertCircle className="text-red-600 mt-1 flex-shrink-0" size={24}/>
            <div>
              <h4 className="font-bold text-red-900">Pago Rechazado</h4>
              <p className="text-sm text-red-800">No pudimos validar tu referencia. Tienes 20 minutos para corregirla antes de perder el cupo.</p>
            </div>
          </div>
          <div className="w-full flex gap-2 mt-2">
            <input type="number" placeholder="Nueva Ref" className="flex-1 p-2 rounded-xl border border-red-200 text-sm outline-none bg-white font-bold text-center" id="nuevaRef" maxLength="4" />
            <Button type="button" variant="dark" className="!w-auto !py-2 !px-4 !text-xs" onClick={async () => {
               const ref = document.getElementById('nuevaRef').value;
               if(ref.length !== 4) return showToast('Debe tener 4 dígitos', 'error');
               await saveReserva({...reservaActualizada, pagoRef: ref, estadoPago: 'Pendiente'});
               showToast('Referencia enviada', 'success');
            }}>Actualizar</Button>
          </div>
        </div>
      )}

      {reservaActualizada.estadoPago === 'Pendiente' && (
        <div className="bg-orange-100 border border-orange-200 p-4 rounded-2xl flex gap-3 mb-6 items-start shadow-sm">
          <AlertCircle className="text-orange-600 mt-1 flex-shrink-0" size={24}/>
          <div><h4 className="font-bold text-orange-900">Validando Pago</h4><p className="text-sm text-orange-800">Verificando tu transferencia (Ref: {reservaActualizada.pagoRef}). El cupo está apartado.</p></div>
        </div>
      )}
      
      {reservaActualizada.estadoPago === 'Aprobado' && (
        <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden mb-6">
          <p className="text-blue-200 text-sm font-bold uppercase tracking-widest mb-1">{cursoAsignado.nombre}</p>
          <h3 className="text-2xl font-black mb-4">{(sedes||[]).find(s=>String(s.id)===String(reservaActualizada.sedeId))?.nombre || 'Sede'} - Moto {reservaActualizada.tipoMoto}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm bg-black/20 p-4 rounded-2xl mb-4">
            <div><span className="block text-blue-300 text-xs">Día 1</span><span className="font-bold">{reservaActualizada.fecha1}</span></div>
            <div><span className="block text-blue-300 text-xs">Día 2</span><span className="font-bold">{reservaActualizada.fecha2}</span></div>
            <div className="col-span-2 flex justify-between">
               <div><span className="block text-blue-300 text-xs">Hora Inicio</span><span className="font-bold">{horaInicio}</span></div>
               <div className="text-right"><span className="block text-blue-300 text-xs">Hora Fin</span><span className="font-bold">{horaFin}</span></div>
            </div>
          </div>
          <p className="text-xs text-blue-200"><span className="inline mr-1 mb-0.5">✔</span>Instructor: {inst ? inst.nombre : 'Asignando'}</p>
        </div>
      )}

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
         <h3 className="font-bold text-gray-900 text-lg">Avance Académico</h3>
         <ProgressBar completados={cantCompletados} total={cursoAsignado.modulos.length} />
      </div>

      <div className="space-y-3">
        {cursoAsignado.modulos.map((mod, i) => {
          const dayDone = (reservaActualizada.modulosEstado || {})[mod];
          return (
            <div key={i} className={`bg-white p-4 rounded-2xl shadow-sm border flex items-center gap-3 transition-all ${dayDone ? 'border-green-200 bg-green-50' : 'border-gray-100 opacity-80'}`}>
              <div className={`p-2 rounded-full flex-shrink-0 ${dayDone ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {dayDone ? <Check size={16}/> : <Clock size={16}/>}
              </div>
              <div className="flex-1">
                <span className={`font-bold text-sm ${dayDone ? 'text-green-900' : 'text-gray-800'}`}>{mod}</span>
                {dayDone && <p className="text-[10px] font-bold text-green-700 mt-0.5">Superado en: {dayDone}</p>}
              </div>
              <span className={`text-[10px] font-black uppercase ${dayDone ? 'text-green-600' : 'text-gray-400'}`}>{dayDone ? 'Superado' : 'Pendiente'}</span>
            </div>
          );
        })}
      </div>
      
      {reservaActualizada.estadoCurso === 'Aprobado' && (
        <Button variant="success" className="mt-6" icon={Award}>Descargar Certificado</Button>
      )}
    </div>
  );
};
