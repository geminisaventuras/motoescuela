import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContextValue';
import { Button, Input, Select } from '../components/UI';
import { ChevronLeft, Users, Briefcase, Plus, Award, Bike, Settings, Edit, Power, DollarSign, Activity, Check, CheckCircle, AlertCircle, BookOpen, MapPin, Clock, ChevronRight, Wallet } from 'lucide-react';

const AdminResumen = ({ setTab }) => {
  const { reservas, instructores } = useContext(AppContext);
  const res = reservas || [];
  const instrs = instructores || [];

  return (
    <div className="animate-in fade-in space-y-6">
      <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest px-1">Panel Administrativo</h2>
      <div onClick={()=>setTab('reservas')} className="bg-blue-600 text-white p-5 rounded-3xl shadow-lg cursor-pointer hover:bg-blue-700 transition-colors relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
         <p className="text-blue-200 text-xs font-bold uppercase tracking-wide">Reservas Pendientes</p>
         <h2 className="text-4xl font-black mt-1">{res.filter(r=>r.estadoPago==='Pendiente' || r.estadoPago==='Rechazado').length}</h2>
      </div>
      <h3 className="font-bold text-gray-900 text-lg border-b pb-2">Últimos Cursos Completados</h3>
      {res.filter(r => r.estadoCurso === 'Aprobado').slice(-5).reverse().map(r => (
        <div key={r.id} className="bg-white p-4 rounded-2xl shadow-sm border border-green-200 mb-3 flex items-center justify-between">
          <div><p className="font-bold text-sm text-gray-900">{r.nombre} {r.apellido}</p><p className="text-xs text-gray-500">Inst: {instrs.find(i=>String(i.id)===String(r.instructorId))?.nombre || 'N/A'}</p></div>
          <Award size={24} className="text-green-500"/>
        </div>
      ))}
      {res.filter(r => r.estadoCurso === 'Aprobado').length === 0 && <p className="text-sm text-gray-500 text-center py-4">No hay cursos completados aún.</p>}
    </div>
  );
};

const AdminFinanzas = () => {
  const { reservas, instructores, proveedores, motos, config, saveReserva, saveMovimiento, showToast } = useContext(AppContext);
  const res = reservas || [];
  const instrs = instructores || [];
  const provs = proveedores || [];
  const motList = motos || [];
  
  const aprovedReservas = res.filter(r => r.estadoPago === 'Aprobado');
  const totalIngresos = aprovedReservas.reduce((acc, r) => acc + Number(r.pagoTotalMoneda || 0), 0);
  const deudasPorPagar = aprovedReservas.reduce((acc, r) => acc + (!r.pagadoInstructor ? Number(r.pagoInstructor || 0) : 0) + (!r.pagadoProveedor ? Number(r.pagoProveedor || 0) : 0), 0);
  const gananciaNeta = totalIngresos - aprovedReservas.reduce((acc, r) => acc + Number(r.pagoInstructor || 0) + Number(r.pagoProveedor || 0), 0);

  const pagarStaff = async (id, tipo, monto, nombre) => {
    for (let r of res) {
      if (r.estadoPago === 'Aprobado') {
        if (tipo === 'instructor' && String(r.instructorId) === String(id) && !r.pagadoInstructor) await saveReserva({ ...r, pagadoInstructor: true });
        if (tipo === 'proveedor' && motList.find(m => String(m.id) === String(r.motoAsignadaId))?.proveedorId === String(id) && !r.pagadoProveedor) await saveReserva({ ...r, pagadoProveedor: true });
      }
    }
    await saveMovimiento({ id: generateId(), tipo: 'egreso', monto, desc: `Comisión: ${nombre}`, fecha: new Date().toISOString().split('T')[0] });
    showToast('Pago registrado correctamente');
  };

  const deudasInst = instrs.map(i => { return { ...i, deuda: res.filter(r => r.estadoPago === 'Aprobado' && String(r.instructorId) === String(i.id) && !r.pagadoInstructor).reduce((acc) => acc + Number(config.pagoInstructor || 0), 0) }; }).filter(i => i.deuda > 0);
  const deudasProv = provs.map(p => { return { ...p, deuda: res.filter(r => r.estadoPago === 'Aprobado' && !r.pagadoProveedor && motList.find(m=>String(m.id)===String(r.motoAsignadaId))?.proveedorId === String(p.id)).reduce((acc) => acc + Number(config.pagoProveedor || 0), 0) }; }).filter(p => p.deuda > 0);

  return (
    <div className="animate-in fade-in space-y-6">
      <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest px-1">Módulo Finanzas</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 p-4 rounded-3xl border-2 border-green-100">
          <p className="text-green-600 text-[10px] font-black uppercase tracking-wide">Ganancia Neta</p>
          <p className="text-2xl font-black text-green-900 mt-1">USD {gananciaNeta}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-3xl border-2 border-orange-100 relative">
          {deudasPorPagar > 0 && <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>}
          <p className="text-orange-600 text-[10px] font-black uppercase tracking-wide">Por Pagar</p>
          <p className="text-2xl font-black text-orange-900 mt-1">{config.monedaPagoStaff} {deudasPorPagar}</p>
        </div>
      </div>
      <h3 className="font-bold text-gray-900 text-lg border-b pb-2 mt-6">Deudas a Personal</h3>
      {deudasInst.length === 0 && deudasProv.length === 0 && <p className="text-sm text-gray-500 text-center">Todo el personal está al día.</p>}
      {deudasInst.map(i => (
         <div key={i.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center mb-2">
           <div><p className="font-bold text-sm">{i.nombre} {i.apellido}</p><p className="text-orange-600 font-black">{config.monedaPagoStaff} {i.deuda}</p></div>
           <Button type="button" onClick={()=>pagarStaff(i.id, 'instructor', i.deuda, i.nombre)} variant="outline" className="!w-auto !py-2 !text-xs">Pagar</Button>
         </div>
      ))}
      {deudasProv.map(p => (
         <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center mb-2">
           <div><p className="font-bold text-sm">{p.nombre}</p><p className="text-orange-600 font-black">{config.monedaPagoStaff} {p.deuda}</p></div>
           <Button type="button" onClick={()=>pagarStaff(p.id, 'proveedor', p.deuda, p.nombre)} variant="outline" className="!w-auto !py-2 !text-xs">Pagar</Button>
         </div>
      ))}
    </div>
  );
};

const generateId = () => String(Date.now());

const AdminReservas = ({ setTab }) => {
  const { reservas, saveReserva, saveMovimiento, showToast, instructores, isReservaActiva } = useContext(AppContext);
  const [selectedInstructorByRes, setSelectedInstructorByRes] = useState({});
  const res = reservas || [];
  
  const aprobarPago = async (id) => {
    const r = res.find(x => String(x.id) === String(id));
    if(!r) return;
    await saveReserva({ ...r, estadoPago: 'Aprobado', estadoCurso: 'En Curso' });
    await saveMovimiento({ id: Date.now().toString(), tipo: 'ingreso', monto: r.pagoTotalMoneda, desc: `Inscripción C-${id.toString().slice(-4)}`, fecha: new Date().toISOString().split('T')[0] });
    showToast('Pago aprobado y curso activado', 'success');
  };
  
  const rechazarPago = async (id) => {
    const r = res.find(x => String(x.id) === String(id));
    if(!r) return;
    await saveReserva({ ...r, estadoPago: 'Rechazado', rechazadoEn: Number(new Date()) });
  };

  const reasignarInstructor = async (r) => {
    const instructorId = selectedInstructorByRes[r.id];
    if (!instructorId) return showToast('Selecciona un instructor válido', 'error');
    if (String(instructorId) === String(r.instructorId)) return showToast('Selecciona un instructor distinto al actual', 'error');
    const instructorExists = (instructores || []).some(i => String(i.id) === String(instructorId));
    if (!instructorExists) return showToast('Instructor no válido', 'error');
    await saveReserva({ ...r, instructorId });
    showToast('Instructor reasignado correctamente', 'success');
  };

  return (
    <div className="animate-in fade-in space-y-4">
      <div className="flex gap-2 mb-6 items-center"><button type="button" onClick={()=>setTab('inicio')} className="p-2 bg-gray-200 rounded-full"><ChevronLeft size={20}/></button><h2 className="text-xl font-black text-gray-900 uppercase">Gestión Reservas</h2></div>
      {res.length === 0 && <p className="text-center text-gray-500 py-6">No hay reservas</p>}
      {res.slice().reverse().map(r => {
        const busyInstructorIds = (reservas || []).filter(other => String(other.id) !== String(r.id) && isReservaActiva(other) && String(other.horaId) === String(r.horaId) &&
          (other.fecha1 === r.fecha1 || other.fecha1 === r.fecha2 || other.fecha2 === r.fecha1 || other.fecha2 === r.fecha2)
        ).map(other => String(other.instructorId));
        const availableInstructors = (instructores || []).filter(i => i.activo && (i.sedes || []).includes(r.sedeId) && !busyInstructorIds.includes(String(i.id)));
        const currentInstructor = (instructores || []).find(i => String(i.id) === String(r.instructorId));
        const currentIsBusy = currentInstructor && busyInstructorIds.includes(String(currentInstructor.id));

        return (
          <div key={r.id} className={`bg-white p-4 rounded-2xl shadow-sm border-l-4 ${r.estadoPago === 'Pendiente' ? 'border-l-orange-500' : r.estadoPago === 'Rechazado' ? 'border-l-red-500' : 'border-l-green-500'} border-t border-r border-b border-gray-100`}>
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-gray-900 text-sm">{r.nombre} {r.apellido} <span className="text-xs text-gray-500 font-normal">({r.cedula})</span></h4>
              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${r.estadoPago === 'Pendiente' ? 'bg-orange-100 text-orange-700' : r.estadoPago === 'Rechazado' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{r.estadoPago}</span>
            </div>
            <p className="text-xs text-gray-600 mb-1 font-bold">D1: {r.fecha1} | D2: {r.fecha2}</p>
            <p className="text-xs text-gray-600 mb-2">Instructor actual: {currentInstructor ? `${currentInstructor.nombre} ${currentInstructor.apellido || ''}` : 'Sin instructor asignado'}</p>
            {currentIsBusy && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-bold">El instructor asignado ya tiene otra clase en este horario. Selecciona uno disponible.</div>
            )}
            <Select
              label="Reasignar Instructor"
              options={availableInstructors}
              value={selectedInstructorByRes[r.id] || ''}
              onChange={e => setSelectedInstructorByRes(prev => ({ ...prev, [r.id]: e.target.value }))}
            />
            {availableInstructors.length === 0 && (
              <p className="text-xs text-gray-500 mb-3">No hay instructores disponibles en este horario/sede.</p>
            )}
            <div className="flex gap-2 flex-wrap mb-3">
              <Button type="button" onClick={() => reasignarInstructor(r)} variant="secondary" className="!py-2 !text-xs" disabled={availableInstructors.length === 0}>Reasignar</Button>
            </div>
            {(r.estadoPago === 'Pendiente' || r.estadoPago === 'Rechazado') && (
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 mt-3">
                <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Validación de Pago</p>
                <p className="text-xs mb-1">Bco: {r.pagoBanco} | Tlf: {r.pagoTelefono} | CI: {r.pagoCedula}</p>
                <p className="text-sm font-black text-blue-900 mb-3">Ref: <span className="text-xl">{r.pagoRef}</span> • Bs. {r.pagoTotalVES}</p>
                <div className="flex gap-2">
                   <Button type="button" onClick={() => aprobarPago(r.id)} variant="success" className="!py-2 !text-xs flex-1" icon={CheckCircle}>Aprobar</Button>
                   <Button type="button" onClick={() => rechazarPago(r.id)} variant="danger" className="!py-2 !text-xs flex-1" icon={AlertCircle}>Rechazar</Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const AdminConfigHub = ({ setTab }) => (
  <div className="animate-in fade-in space-y-6">
    <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest px-1">Configuración</h2>
    <div className="grid grid-cols-2 gap-3">
      <button type="button" onClick={()=>setTab('cursos')} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 hover:border-blue-300 transition-colors"><BookOpen size={28} className="text-blue-500" /> <span className="font-bold text-sm text-gray-800">Cursos</span></button>
      <button type="button" onClick={()=>setTab('sedes')} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 hover:border-blue-300 transition-colors"><MapPin size={28} className="text-blue-500" /> <span className="font-bold text-sm text-gray-800">Sedes</span></button>
      <button type="button" onClick={()=>setTab('horarios')} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 hover:border-blue-300 transition-colors"><Clock size={28} className="text-blue-500" /> <span className="font-bold text-sm text-gray-800">Horarios</span></button>
      <button type="button" onClick={()=>setTab('motos')} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 hover:border-blue-300 transition-colors"><Bike size={28} className="text-blue-500" /> <span className="font-bold text-sm text-gray-800">Motos</span></button>
      <button type="button" onClick={()=>setTab('instructores')} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 hover:border-blue-300 transition-colors"><Users size={28} className="text-blue-500" /> <span className="font-bold text-sm text-gray-800">Instructores</span></button>
      <button type="button" onClick={()=>setTab('proveedores')} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 hover:border-blue-300 transition-colors"><Briefcase size={28} className="text-blue-500" /> <span className="font-bold text-sm text-gray-800">Proveedores</span></button>
    </div>
    <button type="button" onClick={()=>setTab('ajustes')} className="w-full bg-gray-900 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between hover:bg-black transition-colors"><div className="flex items-center gap-3"><Settings size={24} className="text-gray-300"/> <span className="font-bold text-lg">Ajustes Generales</span></div><ChevronRight size={20} className="text-gray-400"/></button>
  </div>
);

const AdminAjustes = ({ setTab }) => {
  const { config, saveConfig, refreshExchangeRates, showToast, rateFetchError } = useContext(AppContext);
  const [localCfg, setLocalCfg] = useState(config || {
    monedaPagoStaff: 'USD', tasaUSD: 36.50, tasaEUR: 39.10, precioBase: 35,
    recargoGuarenas: 5, recargoSinBici: 10, descuentoMotoPropia: 5, descuentoPromo: 0,
    pagoInstructor: 15, pagoProveedor: 10,
    autoTasas: true,
    pagoMovilEscuela: { banco: 'Banesco', telefono: '04141234567', cedula: '12345678' }
  });
  
  const doSave = async () => { await saveConfig(localCfg); setTab('config'); showToast('Ajustes guardados'); };
  
  return (
    <div className="animate-in fade-in space-y-4">
      <div className="flex gap-2 items-center mb-6"><button type="button" onClick={()=>setTab('config')} className="p-2 bg-gray-200 rounded-full"><ChevronLeft size={20}/></button><h2 className="text-xl font-black text-gray-900 uppercase">Ajustes Generales</h2></div>
      
      <div className="bg-white p-5 rounded-2xl border space-y-3">
        <h3 className="font-bold text-gray-700 border-b pb-2 mb-4">Diferencial Cambiario</h3>
        <div className="flex items-center justify-between gap-3">
           <label className="text-sm font-bold text-gray-700">Actualizar tasas automáticamente</label>
           <input type="checkbox" checked={localCfg.autoTasas ?? true} onChange={e=>setLocalCfg({...localCfg, autoTasas: e.target.checked})} className="w-5 h-5 text-blue-600" />
        </div>
        <Input label="Tasa Dólar (USD)" type="number" step="0.01" value={localCfg.tasaUSD || ''} onChange={e=>setLocalCfg({...localCfg, tasaUSD: e.target.value})} icon={Activity} />
        <Input label="Tasa Euro (EUR BCV)" type="number" step="0.01" value={localCfg.tasaEUR || ''} onChange={e=>setLocalCfg({...localCfg, tasaEUR: e.target.value})} icon={Activity} />
        <Button type="button" variant="outline" onClick={async () => { await refreshExchangeRates(); showToast('Tasas actualizadas desde API pública'); }} className="!py-2 !text-sm">Actualizar ahora</Button>
          {config?.tasaLastFetched && (
            <p className="text-xs text-gray-500">Última actualización: {new Date(config.tasaLastFetched).toLocaleString('es-VE')} desde {config.tasaSource || 'API pública'}</p>
          )}
          {config?.autoTasas === false && (
            <p className="text-xs text-orange-600">Auto tasa desactivada. Si deseas, actívala o actualiza manualmente.</p>
          )}
          {rateFetchError && (
            <p className="text-xs text-red-600">Error al actualizar tasas: {rateFetchError}</p>
          )}
        <h3 className="font-bold text-gray-700 border-b pb-2 mb-4">Reglas de Negocio (Base USD)</h3>
        <Input label="Precio Base Curso" type="number" value={localCfg.precioBase || ''} onChange={e=>setLocalCfg({...localCfg, precioBase: e.target.value})} icon={DollarSign}/>
        <Input label="Recargo Sede Guarenas" type="number" value={localCfg.recargoGuarenas || ''} onChange={e=>setLocalCfg({...localCfg, recargoGuarenas: e.target.value})} />
        <Input label="Recargo sin Bici" type="number" value={localCfg.recargoSinBici || ''} onChange={e=>setLocalCfg({...localCfg, recargoSinBici: e.target.value})} />
        <Input label="Desc. Trae Moto" type="number" value={localCfg.descuentoMotoPropia || ''} onChange={e=>setLocalCfg({...localCfg, descuentoMotoPropia: e.target.value})} />
        <Input label="Desc. Promocional" type="number" value={localCfg.descuentoPromo || ''} onChange={e=>setLocalCfg({...localCfg, descuentoPromo: e.target.value})} />
      </div>

      <div className="bg-white p-5 rounded-2xl border space-y-3">
        <h3 className="font-bold text-gray-700 border-b pb-2 mb-4">Comisiones Fijas</h3>
        <Input label={`Pago a Instructor (${localCfg.monedaPagoStaff || 'USD'})`} type="number" value={localCfg.pagoInstructor || ''} onChange={e=>setLocalCfg({...localCfg, pagoInstructor: e.target.value})} />
        <Input label={`Pago a Proveedor (${localCfg.monedaPagoStaff || 'USD'})`} type="number" value={localCfg.pagoProveedor || ''} onChange={e=>setLocalCfg({...localCfg, pagoProveedor: e.target.value})} />
      </div>

      <div className="bg-white p-5 rounded-2xl border space-y-3">
        <h3 className="font-bold text-gray-700 border-b pb-2 mb-4">Pago Móvil Escuela</h3>
        <Select label="Banco" options={['Banesco', 'Mercantil', 'Provincial', 'Venezuela', 'Bancamiga', 'BNC', 'Tesoro']} value={localCfg.pagoMovilEscuela?.banco || ''} onChange={e=>setLocalCfg({...localCfg, pagoMovilEscuela: {...localCfg.pagoMovilEscuela, banco: e.target.value}})} />
        <Input label="Teléfono" value={localCfg.pagoMovilEscuela?.telefono || ''} onChange={e=>setLocalCfg({...localCfg, pagoMovilEscuela: {...localCfg.pagoMovilEscuela, telefono: e.target.value}})} />
        <Input label="Cédula / RIF" value={localCfg.pagoMovilEscuela?.cedula || ''} onChange={e=>setLocalCfg({...localCfg, pagoMovilEscuela: {...localCfg.pagoMovilEscuela, cedula: e.target.value}})} />
      </div>

      <Button type="button" onClick={doSave} variant="success" icon={Check}>Guardar Ajustes</Button>
    </div>
  );
};

const CRUDView = ({ titulo, items, saveFn, formComponent: FormComponent, setTab }) => {
  const { showToast, instructores, saveInstructor } = useContext(AppContext);
  const [itemEdit, setItemEdit] = useState(null);

  const handleSaveGeneral = async (datos, id = null) => {
    if(saveFn === saveInstructor && datos.esPrincipal) {
       for(let i of (instructores||[])) if(String(i.id) !== String(id) && i.esPrincipal) await saveInstructor({...i, esPrincipal: false});
    }
    await saveFn(datos);
    setItemEdit(null); showToast('Guardado exitoso');
  };

  if (itemEdit !== null) return <FormComponent item={itemEdit} onSave={(d) => handleSaveGeneral(d, itemEdit?.id)} onCancel={() => setItemEdit(null)} />;
  
  return (
    <div className="animate-in fade-in pb-24">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2 items-center"><button type="button" onClick={()=>setTab('config')} className="p-2 bg-gray-200 rounded-full"><ChevronLeft size={20}/></button><h2 className="text-xl font-black text-gray-900 uppercase tracking-widest">{titulo}</h2></div>
        <button type="button" onClick={() => setItemEdit({})} className="bg-blue-600 text-white p-2 px-3 rounded-xl font-bold flex gap-1 text-sm shadow-lg"><Plus size={16}/> Nuevo</button>
      </div>
      {(items||[]).map(item => {
        const itemTitle = item.nombre || item.label || (item.marca || item.modelo ? `${item.marca || ''} ${item.modelo || ''}`.trim() : 'Elemento');
        return (
        <div key={item.id} className={`bg-white p-4 rounded-2xl shadow-sm border mb-3 flex items-center justify-between ${item.activo ? 'border-gray-100' : 'border-red-100 opacity-60'}`}>
          <div className="flex-1 pr-2">
            <h4 className="font-bold text-gray-900 text-sm">{itemTitle} {item.apellido || ''}</h4>
            {item.direccion && <p className="text-xs text-gray-500 mt-1">{item.direccion}</p>}
            <div className="flex gap-1 flex-wrap mt-1">
               {!item.activo && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-black uppercase">Inactivo</span>}
               {item.esPrincipal && <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-black uppercase">Principal</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setItemEdit(item)} className="p-2 bg-gray-50 text-gray-600 rounded-lg"><Edit size={16}/></button>
            <button type="button" onClick={async () => {await saveFn({...item, activo: !item.activo}); showToast('Estado cambiado');}} className="p-2 bg-gray-50 rounded-lg"><Power size={16}/></button>
          </div>
        </div>
        );
      })}
    </div>
  );
};

const FormCursos = ({ item, onSave, onCancel }) => {
   const [form, setForm] = useState(item.id ? item : { nombre: '', modulos: [''] });
   return (
     <div className="space-y-4">
       <div className="flex gap-2 items-center mb-4"><button type="button" onClick={onCancel} className="p-2 bg-gray-200 rounded-full"><ChevronLeft size={20}/></button><h3 className="font-bold text-lg">{item.id ? 'Editar' : 'Nuevo'} Curso</h3></div>
       <Input label="Nombre del Curso" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} />
       <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
         <label className="block text-sm font-bold text-gray-700 mb-2">Módulos</label>
         {form.modulos.map((m, i) => (
           <div key={i} className="flex gap-2 mb-2">
             <input className="flex-1 bg-white border-2 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" value={m} onChange={e=>setForm({...form, modulos: form.modulos.map((md,idx)=>idx===i?e.target.value:md)})} />
           </div>
         ))}
         <Button type="button" onClick={()=>setForm({...form, modulos: [...form.modulos, '']})} variant="outline" className="!py-2 text-sm mt-2" icon={Plus}>Añadir Tema</Button>
       </div>
       <Button type="button" onClick={() => onSave(form)} variant="dark">Guardar Curso</Button>
     </div>
   );
};

const FormPersonal = ({ item, onSave, onCancel, rol }) => {
  const { sedes } = useContext(AppContext);
  const isInst = rol === 'instructor';
  const [form, setForm] = useState(item.id ? item : { nombre: '', apellido: '', cedula: '', email: '', password: '', telefono: '', pagoBanco: '', pagoTelefono: '', pagoCedula: '', sedes: [], esPrincipal: false });
  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center mb-4"><button type="button" onClick={onCancel} className="p-2 bg-gray-200 rounded-full"><ChevronLeft size={20}/></button><h3 className="font-bold text-lg">{item.id ? 'Editar' : 'Nuevo'} {rol}</h3></div>
      <Input label="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} />
      {isInst && <Input label="Apellido" value={form.apellido} onChange={e=>setForm({...form, apellido: e.target.value})} />}
      <Input label="Cédula / RIF" value={form.cedula} onChange={e=>setForm({...form, cedula: e.target.value})} />
      <Input label="Teléfono" value={form.telefono} onChange={e=>setForm({...form, telefono: e.target.value})} />
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
         <h4 className="text-sm font-bold text-gray-700 mb-2">Acceso Sistema</h4>
         <Input label="Email" type="email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} />
         <Input label="Contraseña" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} />
      </div>
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
         <h4 className="text-sm font-bold text-blue-900 mb-2">Datos para recibir pagos</h4>
         <Select label="Banco" options={['Banesco', 'Mercantil', 'Provincial', 'Venezuela', 'Bancamiga', 'BNC', 'Tesoro']} value={form.pagoBanco} onChange={e=>setForm({...form, pagoBanco: e.target.value})} />
         <Input label="Teléfono Pago Móvil" value={form.pagoTelefono} onChange={e=>setForm({...form, pagoTelefono: e.target.value})} />
         <Input label="Cédula Pago Móvil" value={form.pagoCedula} onChange={e=>setForm({...form, pagoCedula: e.target.value})} />
      </div>
      <div className="bg-white p-4 rounded-xl border border-gray-200">
         <h4 className="text-sm font-bold text-gray-700 mb-3">Sedes Asignadas</h4>
         <div className="flex flex-col gap-2">
           {(sedes||[]).filter(s=>s.activo).map(s => (
             <label key={s.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg cursor-pointer">
               <input type="checkbox" checked={form.sedes?.includes(s.id)} onChange={() => setForm({...form, sedes: form.sedes?.includes(s.id) ? form.sedes.filter(id => id !== s.id) : [...(form.sedes || []), s.id]})} className="w-5 h-5 text-blue-600 rounded" />
               <span className="font-bold text-gray-800">{s.nombre}</span>
             </label>
           ))}
         </div>
      </div>
      {isInst && (
        <div className="flex items-center gap-2 p-4 bg-gray-50 border rounded-xl">
           <input type="checkbox" checked={form.esPrincipal} onChange={e=>setForm({...form, esPrincipal: e.target.checked})} className="w-5 h-5" />
           <label className="font-bold text-sm text-gray-700">Definir como Instructor Principal</label>
        </div>
      )}
      <Button type="button" onClick={() => onSave(form)} variant="dark">Guardar</Button>
    </div>
  );
};

const FormSede = ({ item, onSave, onCancel }) => {
  const [form, setForm] = useState(item.id ? item : { nombre: '', direccion: '' });
  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center mb-4"><button type="button" onClick={onCancel} className="p-2 bg-gray-200 rounded-full"><ChevronLeft size={20}/></button><h3 className="font-bold text-lg">{item.id ? 'Editar' : 'Nueva'} Sede</h3></div>
      <Input label="Nombre de la Sede" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} />
      <Input label="Dirección / Ubicación" value={form.direccion} onChange={e=>setForm({...form, direccion: e.target.value})} />
      <Button type="button" onClick={() => onSave(form)} variant="dark">Guardar Sede</Button>
    </div>
  );
};

const FormHorario = ({ item, onSave, onCancel }) => {
  const [form, setForm] = useState(item.id ? item : { label: '', isLunch: false });
  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center mb-4"><button type="button" onClick={onCancel} className="p-2 bg-gray-200 rounded-full"><ChevronLeft size={20}/></button><h3 className="font-bold text-lg">{item.id ? 'Editar' : 'Nuevo'} Horario</h3></div>
      <Input label="Rango (Ej: 08:00 AM - 10:00 AM)" value={form.label} onChange={e=>setForm({...form, label: e.target.value})} />
      <div className="flex items-center gap-2 p-4 bg-gray-50 border rounded-xl">
           <input type="checkbox" checked={form.isLunch} onChange={e=>setForm({...form, isLunch: e.target.checked})} className="w-5 h-5" />
           <label className="font-bold text-sm text-gray-700">Es bloque de almuerzo (No reservable)</label>
      </div>
      <Button type="button" onClick={() => onSave(form)} variant="dark">Guardar Horario</Button>
    </div>
  );
};

const FormMoto = ({ item, onSave, onCancel }) => {
  const { proveedores, sedes } = useContext(AppContext);
  const [form, setForm] = useState(item.id ? item : { marca: '', modelo: '', cilindrada: '', tipo: '', proveedorId: '', sedes: [] });
  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center mb-4"><button type="button" onClick={onCancel} className="p-2 bg-gray-200 rounded-full"><ChevronLeft size={20}/></button><h3 className="font-bold text-lg">{item.id ? 'Editar' : 'Nueva'} Moto</h3></div>
      <Select label="Proveedor Dueño" options={proveedores || []} value={form.proveedorId} onChange={e=>setForm({...form, proveedorId: e.target.value})} />
      <Input label="Marca" value={form.marca} onChange={e=>setForm({...form, marca: e.target.value})} />
      <Input label="Modelo" value={form.modelo} onChange={e=>setForm({...form, modelo: e.target.value})} />
      <Input label="Cilindrada (ej. 150cc)" value={form.cilindrada} onChange={e=>setForm({...form, cilindrada: e.target.value})} />
      <Select label="Tipo" options={['Automática', 'Sincrónica']} value={form.tipo} onChange={e=>setForm({...form, tipo: e.target.value})} />
      <div className="bg-white p-4 rounded-xl border border-gray-200">
         <h4 className="text-sm font-bold text-gray-700 mb-3">Sedes donde estará disponible</h4>
         <div className="flex flex-col gap-2">
           {(sedes||[]).filter(s=>s.activo).map(s => (
             <label key={s.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg cursor-pointer">
               <input type="checkbox" checked={form.sedes?.includes(s.id)} onChange={() => setForm({...form, sedes: form.sedes?.includes(s.id) ? form.sedes.filter(id => id !== s.id) : [...(form.sedes || []), s.id]})} className="w-5 h-5 text-blue-600 rounded" />
               <span className="font-bold text-gray-800">{s.nombre}</span>
             </label>
           ))}
         </div>
      </div>
      <Button type="button" onClick={() => onSave(form)} variant="dark">Guardar Moto</Button>
    </div>
  );
};

export const InstructorPanel = () => {
  const { reservas, instructores, showToast } = useContext(AppContext);
  const instructor = instructores?.find(i => i.esPrincipal) || { nombre: 'Instructor' };
  const pendientes = (reservas||[]).filter(r => String(r.instructorId) === String(instructor.id) && r.estadoPago !== 'Rechazado');

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-black text-gray-900">Panel de Instructor</h2>
        <p className="text-sm text-gray-500 mt-2">Bienvenido, {instructor.nombre}. Revisa tus clases asignadas y actualiza estados.</p>
      </div>
      {pendientes.length === 0 ? (
        <div className="bg-blue-50 p-5 rounded-3xl text-blue-900 font-bold">No tienes reservas activas asignadas aún.</div>
      ) : pendientes.map(r => (
        <div key={r.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="font-bold">{r.nombre} {r.apellido}</p>
          <p className="text-xs text-gray-500">Fecha: {r.fecha1} / {r.fecha2}</p>
          <p className="text-sm mt-2">Curso: {r.cursoId} • Horario: {r.horaId}</p>
        </div>
      ))}
      <Button type="button" variant="dark" onClick={() => showToast('Funcionalidad futura de instructor aún en construcción')}>Actualizar estado</Button>
    </div>
  );
};

export const ProveedorPanel = () => {
  const { motos, proveedores } = useContext(AppContext);
  const proveedor = proveedores?.[0] || { nombre: 'Proveedor' };
  const motosProveedor = (motos||[]).filter(m => String(m.proveedorId) === String(proveedor.id));

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-black text-gray-900">Panel de Proveedor</h2>
        <p className="text-sm text-gray-500 mt-2">Hola, {proveedor.nombre}. Administra tus motocicletas y revisa solicitudes de alquiler.</p>
      </div>
      <div className="grid gap-4">
        {motosProveedor.length === 0 ? (
          <div className="bg-orange-50 p-5 rounded-3xl text-orange-900 font-bold">No tienes motos asignadas.</div>
        ) : motosProveedor.map(m => (
          <div key={m.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <p className="font-bold">{m.marca} {m.modelo}</p>
            <p className="text-xs text-gray-500">Tipo: {m.tipo} • Sedes: {(m.sedes||[]).join(', ')}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DashboardView = () => {
  const { motos, cursos, sedes, horarios, instructores, proveedores, saveMoto, saveCurso, saveSede, saveHorario, saveProveedor, handleSaveInstructorSeguro } = useContext(AppContext);
  const [tab, setTab] = useState('inicio'); 

  return (
    <>
      <div className="flex-1 p-5 overflow-y-auto pb-24">
        {tab === 'inicio' && <AdminResumen setTab={setTab} />}
        {tab === 'reservas' && <AdminReservas setTab={setTab} />}
        {tab === 'finanzas' && <AdminFinanzas />}
        {tab === 'config' && <AdminConfigHub setTab={setTab} />}
        {tab === 'ajustes' && <AdminAjustes setTab={setTab} />}
        {tab === 'motos' && <CRUDView titulo="Flota" items={motos} saveFn={saveMoto} formComponent={FormMoto} setTab={setTab} />}
        {tab === 'cursos' && <CRUDView titulo="Cursos" items={cursos} saveFn={saveCurso} formComponent={FormCursos} setTab={setTab} />}
        {tab === 'sedes' && <CRUDView titulo="Sedes" items={sedes} saveFn={saveSede} formComponent={FormSede} setTab={setTab} />}
        {tab === 'horarios' && <CRUDView titulo="Horarios" items={horarios} saveFn={saveHorario} formComponent={FormHorario} setTab={setTab} />}
        {tab === 'instructores' && <CRUDView titulo="Instructores" items={instructores} saveFn={handleSaveInstructorSeguro} formComponent={(p) => <FormPersonal {...p} rol="instructor"/>} setTab={setTab} />}
        {tab === 'proveedores' && <CRUDView titulo="Proveedores" items={proveedores} saveFn={saveProveedor} formComponent={(p) => <FormPersonal {...p} rol="proveedor"/>} setTab={setTab} />}
      </div>
      <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-100 px-6 py-2 shadow-2xl z-30 flex justify-between items-center">
        {[{ id: 'inicio', icon: Activity, label: 'Inicio' }, { id: 'finanzas', icon: Wallet, label: 'Finanzas' }, { id: 'config', icon: Settings, label: 'Configuración' }].map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`flex flex-col items-center w-20 transition-all ${tab === t.id ? 'text-gray-900 transform -translate-y-1' : 'text-gray-400'}`}>
            <div className={`p-1.5 rounded-xl ${tab === t.id ? 'bg-gray-100' : ''}`}><t.icon size={22} className={tab === t.id ? 'stroke-[2.5px]' : ''} /></div>
            <span className="text-[10px] font-bold">{t.label}</span>
          </button>
        ))}
      </div>
    </>
  );
};
