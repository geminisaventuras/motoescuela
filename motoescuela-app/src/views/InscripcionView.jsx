import { useState, useMemo, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContextValue';
import { Button, Input, Select, Spinner } from '../components/UI';
import { ChevronLeft, BookOpen, MapPin, Bike, Zap, User, Hash, Phone, Map, CreditCard, Check, ArrowRight } from 'lucide-react';

const ESTADOS_VZLA = ['Distrito Capital', 'Miranda', 'La Guaira', 'Aragua', 'Carabobo', 'Zulia', 'Táchira'];
const BANCOS = ['Banesco', 'Mercantil', 'Provincial', 'Venezuela', 'Bancamiga', 'BNC', 'Tesoro'];
const SEXOS = ['Masculino', 'Femenino', 'Otro'];

const normalizeText = (value) => String(value || '').trim().replace(/\s+/g, ' ');
const normalizeWords = (value) => normalizeText(value).toLowerCase().replace(/\b([a-záéíóúñü])/g, (_, c) => c.toUpperCase());
const normalizeDigits = (value) => String(value || '').replace(/\D/g, '');
const normalizePhone = (value) => normalizeDigits(value);
const normalizeCedula = (value) => normalizeDigits(value);
const isValidPhone = (value) => /^\d{10,11}$/.test(normalizePhone(value));
const isValidCedula = (value) => /^\d{6,10}$/.test(normalizeCedula(value));
const isValidPaymentRef = (value) => /^\d{4}$/.test(normalizeDigits(value));
const getNextDay = (dateStr) => {
  if(!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00'); d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const isPastBlock = (fecha, label, todayStr) => {
  if (fecha !== todayStr || !label) return false;
  try {
    const startStr = label.split('-')[0].trim();
    const [time, modifier] = startStr.split(' ');
    let [hours, mins] = time.split(':');
    hours = parseInt(hours, 10);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    const blockTime = new Date();
    blockTime.setHours(hours, parseInt(mins, 10), 0, 0);
    return new Date() > blockTime;
  } catch { return false; }
};

export const InscripcionView = () => {
  const { config, cursos, sedes, horarios, reservas, setView, showToast, confirmReservaConLock, createScheduleLock, fetchActiveLocks, releaseScheduleLock, setAutoLoginData, calcularBaseUSD, findAvailableResources, getTodayStr, isReservaActiva, isReservationConflict, authReady } = useContext(AppContext);
  const [step, setStep] = useState(1);
  const [captchaValue, setCaptchaValue] = useState('');
  const [selectedLockId, setSelectedLockId] = useState('');
  const [activeLockIds, setActiveLockIds] = useState([]);
  const [loadingLocks, setLoadingLocks] = useState(false);
  const [captchaA, setCaptchaA] = useState(() => Math.floor(Math.random() * 8) + 1);
  const [captchaB, setCaptchaB] = useState(() => Math.floor(Math.random() * 8) + 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');

  const regenerateCaptcha = () => {
    setCaptchaA(Math.floor(Math.random() * 8) + 1);
    setCaptchaB(Math.floor(Math.random() * 8) + 1);
    setCaptchaValue('');
  };

  const [form, setForm] = useState({
    cursoId: (cursos||[])[0]?.id || '', sedeId: '', tipoMoto: '', horaId: '', fecha1: '', fecha2: '', motoAsignadaId: null, instructorId: null,
    nombre: '', apellido: '', cedula: '', edad: '', sexo: '', estado: '', zona: '', telefono: '',
    sabeBicicleta: '', traeMoto: 'No', pagoBanco: '', pagoTelefono: '', pagoCedula: '', pagoRef: ''
  });

  const fecha2Calc = getNextDay(form.fecha1);
  const baseUSD = calcularBaseUSD(form.sedeId, form.sabeBicicleta, form.traeMoto);
  const precioFinalVES = (baseUSD * (Number(config.tasaEUR) || 1)).toFixed(2);

  useEffect(() => {
    let mounted = true;
    const loadLocks = async () => {
      if (!authReady || !form.fecha1) {
        if (mounted) setActiveLockIds([]);
        if (mounted) setLoadingLocks(false);
        return;
      }

      if (mounted) setLoadingLocks(true);
      try {
        const locks = await fetchActiveLocks(form.fecha1);
        if (mounted) setActiveLockIds(locks);
      } catch {
        if (mounted) setActiveLockIds([]);
      } finally {
        if (mounted) setLoadingLocks(false);
      }
    };

    loadLocks();
    return () => { mounted = false; };
  }, [authReady, form.fecha1, fetchActiveLocks]);

  useEffect(() => {
    if (!selectedLockId) return;
    let mounted = true;

    const maybeReleaseLock = async () => {
      if (!form.fecha1 || !form.sedeId || !form.tipoMoto || !form.traeMoto) {
        await releaseScheduleLock(selectedLockId).catch(() => {});
        if (mounted) {
          setSelectedLockId('');
          setForm(prev => ({ ...prev, horaId: '', motoAsignadaId: null, instructorId: null }));
        }
      }
    };

    maybeReleaseLock();
    return () => { mounted = false; };
  }, [form.fecha1, form.sedeId, form.tipoMoto, form.traeMoto, selectedLockId, releaseScheduleLock]);

  const bloquesDisponibles = useMemo(() => {
    if (!form.fecha1 || !form.sedeId || !form.tipoMoto) {
      return [];
    }

    const activeHorarios = [...(horarios||[]).filter(h => h.activo)].sort((a,b) => a.id.localeCompare(b.id));
    const todayStr = getTodayStr();

    return activeHorarios.map(block => {
      let reason = '';
      let disponible = false;
      let motoAsignar = null;
      let instructorId = null;

      if (isPastBlock(form.fecha1, block.label, todayStr)) {
        reason = 'TIEMPO AGOTADO';
      } else {
        const resources = findAvailableResources({
          fecha1: form.fecha1,
          fecha2: fecha2Calc,
          horaId: block.id,
          sedeId: form.sedeId,
          tipoMoto: form.tipoMoto,
          traeMoto: form.traeMoto,
          activeLockIds
        });
        if (resources) {
          disponible = true;
          motoAsignar = resources.motoAsignadaId;
          instructorId = resources.instructorId;
        } else {
          reason = activeLockIds.some(lockId => lockId.startsWith(`${form.fecha1}_${block.id}_`)) ? 'BLOQUEO ACTIVO' : (form.traeMoto === 'Sí' ? 'PERSONAL OCUPADO' : 'SIN DISPONIBILIDAD');
        }
      }

      if (disponible && block.isLunch) {
        disponible = false;
        reason = 'ALMUERZO';
      }

      return { ...block, disponible, reason, motoAsignar, instructorId };
    });
  }, [form.fecha1, form.sedeId, form.tipoMoto, form.traeMoto, fecha2Calc, horarios, findAvailableResources, getTodayStr, activeLockIds]);

  const handleSelectHorario = async (bloque) => {
    if (!bloque.disponible || bloque.isLunch) return;
    if (!form.fecha1 || !form.sedeId || !form.tipoMoto) {
      return showToast('Completa fecha, sede y tipo de moto antes de seleccionar un horario.', 'error');
    }

    const lockPayload = {
      fecha1: form.fecha1,
      horaId: bloque.id,
      instructorId: bloque.instructorId,
      motoAsignadaId: bloque.motoAsignar,
      sedeId: form.sedeId,
      tipoMoto: form.tipoMoto,
      traeMoto: form.traeMoto,
    };

    try {
      const lockId = await createScheduleLock(lockPayload);
      setForm(prev => ({ ...prev, horaId: bloque.id, motoAsignadaId: bloque.motoAsignar, instructorId: bloque.instructorId }));
      setSelectedLockId(lockId);
      setActiveLockIds(prev => prev.includes(lockId) ? prev : [...prev, lockId]);
      showToast('Horario bloqueado temporalmente. Continúa con tus datos.', 'success');
    } catch (error) {
      showToast(error.message || 'No se pudo bloquear el horario. Intenta con otro.', 'error');
      if (bloque.horaId === form.horaId) {
        setForm(prev => ({ ...prev, horaId: '', motoAsignadaId: null, instructorId: null }));
        setSelectedLockId('');
      }
    }
  };

  const handleNext = async () => {
    if (step === 1 && (!form.cursoId || !form.sedeId || !form.tipoMoto || !form.horaId || !form.fecha1)) return showToast('Complete filtros de disponibilidad.', 'error');
    if (step === 1) {
      const selectedBlock = bloquesDisponibles.find(b => String(b.id) === String(form.horaId));
      if (!selectedBlock?.disponible) return showToast('El horario seleccionado ya no está disponible. Elige otro.', 'error');
      if (!selectedLockId) return showToast('No se ha bloqueado el horario. Selecciona nuevamente el horario.', 'error');
    }
    if (step === 2) {
      const normalizedCedula = normalizeCedula(form.cedula);
      const normalizedPhone = normalizePhone(form.telefono);
      const ageNumber = Number(form.edad);
      if (!form.nombre || !form.apellido || !normalizedCedula || !form.edad || !form.sexo || !form.estado || !form.zona || !form.sabeBicicleta || !normalizedPhone) return showToast('Faltan datos personales.', 'error');
      if (!isValidCedula(normalizedCedula)) return showToast('Cédula inválida. Usa entre 6 y 10 dígitos.', 'error');
      if (!isValidPhone(normalizedPhone)) return showToast('Teléfono inválido. Usa 10 u 11 dígitos.', 'error');
      if (!Number.isInteger(ageNumber) || ageNumber < 18 || ageNumber > 120) return showToast('Solo mayores de 18 años pueden registrarse.', 'error');
      const duplicate = (reservas || []).some(r =>
        isReservaActiva(r)
        && isReservationConflict(r, form.fecha1, fecha2Calc, form.horaId)
        && (
          normalizeCedula(r.cedula) === normalizedCedula
          || normalizePhone(r.telefono) === normalizedPhone
        )
      );
      if (duplicate) return showToast('Ya existe una reserva activa para este horario con la misma cédula o teléfono.', 'error');
    }
    const captchaAnswer = captchaA + captchaB;
    if (step === 3) {
      if (!form.pagoBanco || !isValidPhone(form.pagoTelefono) || !isValidCedula(form.pagoCedula) || !isValidPaymentRef(form.pagoRef)) {
        return showToast('Complete los datos de pago correctamente.', 'error');
      }
      if (captchaValue !== String(captchaAnswer)) {
        regenerateCaptcha();
        return showToast('La suma está mal. Intenta de nuevo.', 'error');
      }

      setIsSubmitting(true);
      setSubmissionError('');
      const resources = findAvailableResources({
        fecha1: form.fecha1,
        fecha2: fecha2Calc,
        horaId: form.horaId,
        sedeId: form.sedeId,
        tipoMoto: form.tipoMoto,
        traeMoto: form.traeMoto,
        activeLockIds
      });
      if (!resources) return showToast('El instructor o moto ya no está disponible. Elige otro horario.', 'error');

      const pagoProv = form.traeMoto === 'Sí' ? 0 : config.pagoProveedor;
      const nuevaReserva = {
        ...form,
        nombre: normalizeWords(form.nombre),
        apellido: normalizeWords(form.apellido),
        cedula: normalizeCedula(form.cedula),
        telefono: normalizePhone(form.telefono),
        estado: normalizeWords(form.estado),
        zona: normalizeText(form.zona),
        pagoTelefono: normalizePhone(form.pagoTelefono),
        pagoCedula: normalizeCedula(form.pagoCedula),
        pagoRef: normalizeDigits(form.pagoRef).slice(-4),
        fecha2: fecha2Calc,
        id: String(Date.now()),
        estadoCurso: 'Pendiente', estadoPago: 'Pendiente', instructorId: resources.instructorId,
        motoAsignadaId: resources.motoAsignadaId,
        pagoTotalMoneda: baseUSD, pagoTotalVES: precioFinalVES,
        pagoInstructor: config.pagoInstructor, pagoProveedor: pagoProv,
        pagadoInstructor: false, pagadoProveedor: false, modulosEstado: {},
        expiraEn: Date.now() + 20 * 60 * 1000
      };

      try {
        const savedData = await confirmReservaConLock(nuevaReserva, selectedLockId);
        setSelectedLockId('');
        showToast('¡Inscripción registrada con éxito!', 'success');
        setAutoLoginData(savedData);
        setView('portal');
      } catch (error) {
        const message = error.message || 'No se pudo completar la reserva. Intenta de nuevo.';
        setSubmissionError(message);
        showToast(message, 'error');
        if (message.includes('expiró') || message.includes('comienza') || message.includes('sesión')) {
          setSelectedLockId('');
          setStep(1);
          setForm(prev => ({ ...prev, horaId: '', motoAsignadaId: null, instructorId: null }));
        }
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="bg-white min-h-screen flex flex-col relative">
      <div className="flex items-center gap-3 p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
        <button type="button" onClick={() => step > 1 ? setStep(step-1) : setView('home')} className="p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-200"><ChevronLeft size={24} /></button>
        <h2 className="text-xl font-black text-gray-900 uppercase">Inscripción</h2>
      </div>
      {!authReady ? (
        <div className="p-5 flex-1"><Spinner message="Cargando datos de la escuela..." /></div>
      ) : (
        <div className="p-5 flex-1 overflow-y-auto pb-32">
          <div className="flex justify-between mb-8">
            {[1, 2, 3].map(i => <div key={i} className={`h-2 flex-1 mx-1 rounded-full transition-colors ${step >= i ? 'bg-blue-600' : 'bg-gray-200'}`} />)}
          </div>
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h3 className="font-bold text-gray-900 text-lg mb-2">1. Configurar Clase</h3>
            <Select label="Curso a tomar" options={(cursos||[]).filter(c=>c.activo)} value={form.cursoId} onChange={e => setForm({...form, cursoId: e.target.value})} icon={BookOpen} />
            <Select label="Sede de Práctica" options={(sedes||[]).filter(s=>s.activo)} value={form.sedeId} onChange={e => setForm({...form, sedeId: e.target.value, horaId: ''})} icon={MapPin} />
            <Input label="Fecha (Día 1)" type="date" value={form.fecha1} onChange={e => setForm({...form, fecha1: e.target.value, horaId: ''})} min={getTodayStr()}/>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
               <Select label="¿Traerá su propia moto?" options={['No', 'Sí']} value={form.traeMoto} onChange={e => setForm({...form, traeMoto: e.target.value, horaId: ''})} icon={Bike} />
               <Select label="Tipo de Moto" options={['Automática', 'Sincrónica']} value={form.tipoMoto} onChange={e => setForm({...form, tipoMoto: e.target.value, horaId: ''})} icon={Zap} />
            </div>
            {bloquesDisponibles.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-bold text-gray-700">Seleccione el Horario</label>
                  {loadingLocks && <span className="text-xs text-gray-500">Cargando bloqueos...</span>}
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {bloquesDisponibles.map(b => (
                    <button key={b.id} type="button" disabled={!b.disponible || b.isLunch}
                      onClick={() => handleSelectHorario(b)}
                      className={`w-full p-3 rounded-xl border-2 text-left flex justify-between items-center transition-all
                      ${!b.disponible || b.isLunch ? 'bg-gray-50 border-gray-100 opacity-60' : form.horaId === b.id ? 'bg-blue-50 border-blue-500 text-blue-800' : 'bg-white border-gray-200 hover:border-blue-300'}`}>
                      <span className="font-bold text-sm">{b.label}</span>
                      {b.isLunch ? <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-1 rounded font-black uppercase">ALMUERZO</span>
                      : !b.disponible ? <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded font-black uppercase">{b.reason || 'OCUPADO'}</span> : null}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h3 className="font-bold text-gray-900 text-lg mb-2">2. Datos Personales</h3>
            <div className="grid grid-cols-2 gap-3"><Input label="Nombres" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} icon={User}/><Input label="Apellidos" value={form.apellido} onChange={e => setForm({...form, apellido: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3"><Input label="Cédula" type="tel" value={form.cedula} onChange={e => setForm({...form, cedula: e.target.value.replace(/\D/g, '').slice(0,10)})} icon={Hash} helperText="Solo dígitos, 6-10 caracteres" /><Input label="Edad" type="number" min="1" max="120" value={form.edad} onChange={e => setForm({...form, edad: e.target.value.replace(/\D/g, '').slice(0,3)})} /></div>
            <div className="grid grid-cols-2 gap-3"><Select label="Sexo" options={SEXOS} value={form.sexo} onChange={e => setForm({...form, sexo: e.target.value})} /><Input label="Teléfono" type="tel" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value.replace(/\D/g, '').slice(0,11)})} icon={Phone} helperText="Solo dígitos, 10-11 caracteres" /></div>
            <Select label="Estado de Vzla" options={ESTADOS_VZLA} value={form.estado} onChange={e => setForm({...form, estado: e.target.value})} />
            <Input label="Zona Corta (ej. Petare)" value={form.zona} onChange={e => setForm({...form, zona: e.target.value})} icon={Map} />
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 mt-2">
              <Select label="¿Sabe andar en bicicleta?" options={['Sí', 'No']} value={form.sabeBicicleta} onChange={e => setForm({...form, sabeBicicleta: e.target.value})} icon={Bike} />
              {form.sabeBicicleta === 'No' && <p className="text-xs text-orange-700 font-bold mt-2">Instrucción especial (+USD {config.recargoSinBici}).</p>}
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h3 className="font-bold text-gray-900 text-lg mb-2 flex items-center gap-2"><CreditCard/> Realizar Pago</h3>
            <div className="bg-blue-600 text-white p-5 rounded-2xl shadow-lg mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
              <p className="text-sm opacity-80 mb-1">Total a Cancelar (Pago Móvil)</p>
              <h4 className="text-4xl font-black mb-1">Bs. {precioFinalVES}</h4>
              <p className="text-sm font-medium opacity-90">Base: USD {baseUSD} (Tasa EUR BCV: {config.tasaEUR})</p>
              {config?.tasaSource && <p className="text-xs text-white/80">Tasa desde {config.tasaSource}{config?.tasaLastFetched ? ` • actualizado ${new Date(config.tasaLastFetched).toLocaleString('es-VE')}` : ''}</p>}
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 mb-6">
               <p className="text-xs text-gray-500 font-bold uppercase tracking-widest border-b pb-2">Datos Escuela</p>
               <p className="text-sm flex justify-between"><span className="font-bold">Banco:</span> <span>{config.pagoMovilEscuela?.banco}</span></p>
               <p className="text-sm flex justify-between"><span className="font-bold">Teléfono:</span> <span>{config.pagoMovilEscuela?.telefono}</span></p>
               <p className="text-sm flex justify-between"><span className="font-bold">Cédula:</span> <span>{config.pagoMovilEscuela?.cedula}</span></p>
            </div>
            <h4 className="font-bold text-gray-700 text-sm mb-2 uppercase tracking-wide">Reporte su pago</h4>
            <Select label="Banco Emisor" options={BANCOS} value={form.pagoBanco} onChange={e => setForm({...form, pagoBanco: e.target.value})} icon={CreditCard}/>
            <Input label="Teléfono Origen" type="tel" value={form.pagoTelefono} onChange={e => setForm({...form, pagoTelefono: e.target.value.replace(/\D/g, '').slice(0,11)})} icon={Phone} placeholder="04141234567" helperText="Solo dígitos, 10 u 11 caracteres" />
            <Input label="Cédula Titular" type="tel" value={form.pagoCedula} onChange={e => setForm({...form, pagoCedula: e.target.value.replace(/\D/g, '').slice(0,10)})} icon={Hash} helperText="Solo dígitos, hasta 10 caracteres" />
            <Input label="Últimos 4 dígitos Ref." type="tel" value={form.pagoRef} onChange={e => setForm({...form, pagoRef: e.target.value.replace(/\D/g, '').slice(0,4)})} icon={Hash} placeholder="8452" helperText="Solo 4 dígitos" />
            <div className="mt-4 p-4 rounded-xl border border-blue-200 bg-blue-50">
              <p className="font-bold text-sm text-blue-700 mb-2">Captcha de seguridad</p>
              <p className="text-2xl font-black tracking-widest text-blue-900 text-center mb-3">¿Cuánto es {captchaA} + {captchaB}?</p>
              <Input label="Respuesta" type="tel" value={captchaValue} onChange={e => setCaptchaValue(e.target.value.replace(/\D/g, '').slice(0,2))} helperText="Solo dígitos, escribe el resultado de la suma" />
            </div>
          </div>
        )}
        </div>
      )}

      <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-100 p-4 z-20 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
          {submissionError && <p className="text-sm text-red-600 mb-3">{submissionError}</p>}
          <Button type="button" onClick={handleNext} icon={step === 3 ? Check : ArrowRight} disabled={isSubmitting}>
            {isSubmitting ? 'Procesando...' : step === 3 ? 'Confirmar y Enviar Pago' : 'Continuar'}
          </Button>
      </div>
    </div>
  );
};
