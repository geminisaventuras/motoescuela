import { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, runTransaction, query, where, getDocs, getDoc, deleteDoc, Timestamp } from 'firebase/firestore';

const generateReservaId = () => String(Date.now());
const buildLockId = ({ fecha1, horaId, instructorId, motoAsignadaId }) => `${fecha1}_${horaId}_${String(instructorId)}_${motoAsignadaId ? String(motoAsignadaId) : 'sinmoto'}`;

let app, auth, db, appId = 'motoescuela-pro-v1';
try {
  const firebaseConfig = typeof window !== 'undefined' && window.__firebase_config ? JSON.parse(window.__firebase_config) : null;
  appId = typeof window !== 'undefined' && typeof window.__app_id !== 'undefined' ? window.__app_id : 'motoescuela-pro-v1';
  if (firebaseConfig) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (error) {
  console.error('Error Firebase', error);
}

import { AppContext } from './AppContextValue';

const INITIAL_CONFIG = {
  monedaPagoStaff: 'USD', tasaUSD: 36.50, tasaEUR: 39.10, precioBase: 35,
  recargoGuarenas: 5, recargoSinBici: 10, descuentoMotoPropia: 5, descuentoPromo: 0,
  pagoInstructor: 15, pagoProveedor: 10,
  autoTasas: true,
  pagoMovilEscuela: { banco: 'Banesco', telefono: '04141234567', cedula: '12345678' }
};

export const AppProvider = ({ children }) => {
  const [fbUser, setFbUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [ratesFetchedThisSession, setRatesFetchedThisSession] = useState(false);
  const [rateFetchError, setRateFetchError] = useState(null);
  const [view, setView] = useState('home'); 
  const [user, setUser] = useState(null); 
  const [toast, setToast] = useState(null);
  const [autoLoginData, setAutoLoginData] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  useEffect(() => {
    const initAuth = async () => {
      if (!auth) {
        setAuthReady(true);
        return;
      }
      try {
        const token = typeof window !== 'undefined' && window.__initial_auth_token ? window.__initial_auth_token : null;
        if (token) await signInWithCustomToken(auth, token);
        else await signInAnonymously(auth);
      } catch (error) {
        console.error('Auth error', error);
      }
    };
    initAuth();
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, u => {
      setFbUser(u);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const useFirebaseCollection = (colName, initialData = [], fbUser, authReady) => {
    const [data, setData] = useState(initialData);
    useEffect(() => {
      if (!db || !fbUser || !authReady) return;
      const ref = collection(db, 'artifacts', appId, 'public', 'data', colName);
      const unsub = onSnapshot(ref, (snap) => {
        if (snap.empty && initialData.length > 0) {
          initialData.forEach(item => setDoc(doc(db, 'artifacts', appId, 'public', 'data', colName, String(item.id)), { ...item, id: String(item.id) }));
        } else if (!snap.empty) {
          setData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      }, (err) => console.error(err));
      return () => unsub();
    }, [fbUser, authReady, colName, initialData]);

    const saveItem = async (item) => {
      const id = item.id ? String(item.id) : Date.now().toString();
      const newItem = { ...item, id };
      if (db && fbUser) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', colName, id), newItem);
      else setData(prev => prev.find(i => String(i.id) === id) ? prev.map(i => String(i.id) === id ? newItem : i) : [...prev, newItem]);
      return newItem;
    };
    return [data, saveItem];
  };

  const useFirebaseConfig = (fbUser, authReady) => {
    const [cfg, setCfg] = useState(INITIAL_CONFIG);
    useEffect(() => {
      if (!db || !fbUser || !authReady) return;
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'configuraciones', 'main');
      const unsub = onSnapshot(docRef, (snap) => {
        if (snap.exists()) setCfg(snap.data()); else setDoc(docRef, INITIAL_CONFIG);
      });
      return () => unsub();
    }, [fbUser, authReady]);
    const saveCfg = async (newCfg) => {
      if (db && fbUser && authReady) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'configuraciones', 'main'), newCfg);
      else setCfg(newCfg);
    };
    return [cfg, saveCfg];
  };

  const [config, saveConfig] = useFirebaseConfig(fbUser, authReady);
  const [sedes, saveSede] = useFirebaseCollection('sedes', [{ id: '1', nombre: 'Caracas', direccion: 'Chacao', activo: true }, { id: '2', nombre: 'Guarenas', direccion: 'Centro', activo: true }], fbUser, authReady);
  const [horarios, saveHorario] = useFirebaseCollection('horarios', [{ id: 'h1', label: '08:00 AM - 10:00 AM', isLunch: false, activo: true }, { id: 'h2', label: '10:00 AM - 12:00 PM', isLunch: false, activo: true }, { id: 'h3', label: '12:00 PM - 02:00 PM', isLunch: true, activo: true }, { id: 'h4', label: '02:00 PM - 04:00 PM', isLunch: false, activo: true }, { id: 'h5', label: '04:00 PM - 06:00 PM', isLunch: false, activo: true }], fbUser, authReady);
  const [cursos, saveCurso] = useFirebaseCollection('cursos', [{ id: 'c1', nombre: 'Curso Básico', modulos: ['Teoría y Normativas', 'Equilibrio', 'Arranque y Frenado', 'Habilidades'], activo: true }], fbUser, authReady);
  const [instructores, saveInstructor] = useFirebaseCollection('instructores', [{ id: '1', nombre: 'Armando', apellido: 'Instructor', cedula: '15000111', telefono: '04141112233', email: 'admin@escuela.com', password: '123', pagoBanco: 'Banesco', pagoTelefono: '04141112233', pagoCedula: '15000111', sedes: ['1', '2'], esPrincipal: true, activo: true }], fbUser, authReady);
  const [proveedores, saveProveedor] = useFirebaseCollection('proveedores', [{ id: '1', nombre: 'María López', cedula: 'J-1234567', telefono: '02125554433', email: 'maria@motos.com', password: '123', pagoBanco: 'Banesco', pagoTelefono: '04140001111', pagoCedula: 'J1234567', activo: true }], fbUser, authReady);
  const [motos, saveMoto] = useFirebaseCollection('motos', [{ id: '1', marca: 'Bera', modelo: 'SBR', cilindrada: '150cc', tipo: 'Sincrónica', proveedorId: '1', sedes: ['1', '2'], activa: true }, { id: '2', marca: 'Yamaha', modelo: 'BWS', cilindrada: '125cc', tipo: 'Automática', proveedorId: '1', sedes: ['1', '2'], activa: true }], fbUser, authReady);
  const [reservas, saveReserva] = useFirebaseCollection('reservas', [], fbUser, authReady);
  const [movimientos, saveMovimiento] = useFirebaseCollection('movimientos', [], fbUser, authReady);
  const [admins, saveAdmin] = useFirebaseCollection('admins', [], fbUser, authReady);

  // Inicializar admin predeterminado si la colección está vacía
  useEffect(() => {
    if (authReady && fbUser && admins.length === 0) {
      const defaultAdmin = {
        id: 'admin1',
        nombre: 'Armando',
        apellido: 'Salas',
        cedula: '19497344',
        telefono: '04127185256',
        email: 'admin@escuela.com',
        password: '123456',
        rol: 'admin'
      };
      saveAdmin(defaultAdmin);
    }
  }, [authReady, fbUser, admins.length, saveAdmin]);

  const saveReservaSeguro = async (reserva) => {
    if (!db || !fbUser || !authReady) throw new Error('Firebase no disponible');
    const reservasCollection = collection(db, 'artifacts', appId, 'public', 'data', 'reservas');
    const reservaId = reserva.id ? String(reserva.id) : generateReservaId();
    const reservaDoc = doc(reservasCollection, reservaId);

    return await runTransaction(db, async (transaction) => {
      const scheduleQuery = query(reservasCollection, where('horaId', '==', reserva.horaId), where('sedeId', '==', reserva.sedeId));
      const snapshot = await transaction.get(scheduleQuery);
      const activeReservations = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(isReservaActiva);

      const conflictExists = activeReservations.some(r => isReservationConflict(r, reserva.fecha1, reserva.fecha2, reserva.horaId));
      if (conflictExists) {
        throw new Error('El horario ya no está disponible. Elige otro bloque.');
      }

      const duplicatePersona = activeReservations.some(r =>
        String(r.cedula) === String(reserva.cedula)
        && isReservationConflict(r, reserva.fecha1, reserva.fecha2, reserva.horaId)
      );
      if (duplicatePersona) {
        throw new Error('Ya existe una reserva activa para esta cédula en el mismo horario.');
      }

      const availableInstructors = instructores
        .filter(i => i.activo && (i.sedes || []).includes(reserva.sedeId))
        .filter(inst => !activeReservations.some(r => String(r.instructorId) === String(inst.id) && isReservationConflict(r, reserva.fecha1, reserva.fecha2, reserva.horaId)));

      if (availableInstructors.length === 0) {
        throw new Error('No hay instructores disponibles para el horario seleccionado.');
      }

      const selectedInstructor = availableInstructors.find(i => i.esPrincipal) || availableInstructors[0];
      let motoAsignadaId = null;

      if (reserva.traeMoto !== 'Sí') {
        const motosDelTipo = (motos || []).filter(m => m.tipo === reserva.tipoMoto && m.activa && (m.sedes || []).includes(reserva.sedeId));
        if (motosDelTipo.length === 0) {
          throw new Error('No hay motos disponibles para el tipo seleccionado.');
        }

        const occupiedMotoIds = activeReservations
          .filter(r => isReservationConflict(r, reserva.fecha1, reserva.fecha2, reserva.horaId) && r.traeMoto !== 'Sí')
          .map(r => String(r.motoAsignadaId));

        const availableMoto = motosDelTipo.find(m => !occupiedMotoIds.includes(String(m.id)));
        if (!availableMoto) {
          throw new Error('No hay motos libres para ese horario.');
        }
        motoAsignadaId = availableMoto.id;
      }

      const finalReserva = {
        ...reserva,
        id: reservaId,
        instructorId: selectedInstructor.id,
        motoAsignadaId,
      };

      transaction.set(reservaDoc, finalReserva);
      return finalReserva;
    });
  };

  const createScheduleLock = async ({ fecha1, horaId, instructorId, motoAsignadaId, sedeId, tipoMoto, traeMoto }) => {
    if (!db || !fbUser || !authReady) throw new Error('Firebase no disponible');
    if (!fecha1 || !horaId || !instructorId) throw new Error('Faltan datos para bloquear el horario.');
    const lockId = buildLockId({ fecha1, horaId, instructorId, motoAsignadaId });
    const lockRef = doc(db, 'locks', lockId);

    await runTransaction(db, async (transaction) => {
      const lockSnap = await transaction.get(lockRef);
      const ahora = Timestamp.now();
      if (lockSnap.exists() && lockSnap.data().expiresAt.toMillis() > ahora.toMillis()) {
        throw new Error('Horario bloqueado temporalmente');
      }
      transaction.set(lockRef, {
        expiresAt: Timestamp.fromMillis(Date.now() + 5 * 60 * 1000),
        userId: fbUser?.uid || 'anon',
        fecha1,
        horaId,
        instructorId,
        motoAsignadaId: motoAsignadaId || null,
        sedeId,
        tipoMoto,
        traeMoto,
      });
    });

    return lockId;
  };

  const fetchActiveLocks = async (fecha1) => {
    if (!db || !fbUser || !authReady || !fecha1) return [];
    const locksRef = collection(db, 'locks');
    const locksQuery = query(locksRef, where('fecha1', '==', fecha1), where('expiresAt', '>', Timestamp.now()));
    const snapshot = await getDocs(locksQuery);
    return snapshot.docs.map(doc => doc.id);
  };

  const releaseScheduleLock = async (lockId) => {
    if (!db || !fbUser || !authReady || !lockId) return;
    const lockRef = doc(db, 'locks', lockId);
    const lockSnap = await getDoc(lockRef);
    if (lockSnap.exists() && lockSnap.data().userId === (fbUser?.uid || 'anon')) {
      await deleteDoc(lockRef);
    }
  };

  const confirmReservaConLock = async (reserva, lockId) => {
    if (!db || !fbUser || !authReady) throw new Error('Firebase no disponible');
    if (!lockId) throw new Error('No se encontró el lock de la reserva. Por favor selecciona el horario nuevamente.');

    const reservasCollection = collection(db, 'artifacts', appId, 'public', 'data', 'reservas');
    const finalId = reserva.id ? String(reserva.id) : generateReservaId();
    const reservaRef = doc(reservasCollection, finalId);
    const lockRef = doc(db, 'locks', lockId);

    return await runTransaction(db, async (transaction) => {
      const lockSnap = await transaction.get(lockRef);
      if (!lockSnap.exists() || lockSnap.data().userId !== (fbUser?.uid || 'anon')) {
        throw new Error('Tu sesión expiró. Por favor comienza de nuevo.');
      }
      if (lockSnap.data().expiresAt.toMillis() <= Timestamp.now().toMillis()) {
        throw new Error('El lock expiró. Por favor selecciona otro horario.');
      }

      const scheduleQuery = query(reservasCollection, where('horaId', '==', reserva.horaId), where('sedeId', '==', reserva.sedeId));
      const snapshot = await transaction.get(scheduleQuery);
      const activeReservations = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(isReservaActiva);

      const conflictExists = activeReservations.some(r => isReservationConflict(r, reserva.fecha1, reserva.fecha2, reserva.horaId));
      if (conflictExists) {
        throw new Error('El horario ya no está disponible. Elige otro bloque.');
      }

      const duplicatePersona = activeReservations.some(r =>
        String(r.cedula) === String(reserva.cedula)
        && isReservationConflict(r, reserva.fecha1, reserva.fecha2, reserva.horaId)
      );
      if (duplicatePersona) {
        throw new Error('Ya existe una reserva activa para esta cédula en el mismo horario.');
      }

      const finalReserva = { ...reserva, id: finalId };
      transaction.set(reservaRef, finalReserva);
      transaction.delete(lockRef);
      return finalReserva;
    });
  };

  const refreshExchangeRates = useCallback(async () => {
    if (!config?.autoTasas) {
      setRateFetchError('La actualización automática de tasas está desactivada.');
      return;
    }
    try {
      const response = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=VES,EUR');
      const result = await response.json();
      if (!response.ok || !result?.rates || typeof result.rates.VES !== 'number' || typeof result.rates.EUR !== 'number') {
        throw new Error('No se pudieron leer las tasas desde el proveedor externo.');
      }
      const tasaUSD = Number(result.rates.VES.toFixed(2));
      const tasaEUR = Number((result.rates.VES / result.rates.EUR).toFixed(2));
      await saveConfig({ ...config, tasaUSD, tasaEUR, tasaLastFetched: Date.now(), tasaSource: 'exchangerate.host' });
      setRateFetchError(null);
    } catch (error) {
      console.error('Error fetching exchange rates', error);
      setRateFetchError(error.message || 'Error al actualizar tasas.');
    }
  }, [config, saveConfig]);

  useEffect(() => {
    if (!fbUser || !authReady || !config?.autoTasas || ratesFetchedThisSession) return;
    let cancelled = false;
    const fetchRates = async () => {
      await refreshExchangeRates();
      if (!cancelled) setRatesFetchedThisSession(true);
    };
    fetchRates();
    return () => { cancelled = true; };
  }, [fbUser, authReady, config?.autoTasas, ratesFetchedThisSession, refreshExchangeRates]);

  // Helpers
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const isReservaActiva = (r) => {
    if (r.estadoPago === 'Aprobado' || r.estadoPago === 'Pendiente') return true;
    if (r.estadoPago === 'Rechazado') {
      if (r.expiraEn) {
        return Date.now() < Number(r.expiraEn);
      }
      if (r.rechazadoEn) {
        return (Date.now() - r.rechazadoEn) / 60000 < 20;
      }
    }
    return false;
  };

  const isReservationConflict = (r, fecha1, fecha2, horaId) => {
    return String(r.horaId) === String(horaId) && isReservaActiva(r) && (
      r.fecha1 === fecha1 || r.fecha1 === fecha2 || r.fecha2 === fecha1 || r.fecha2 === fecha2
    );
  };

  const findAvailableResources = ({ fecha1, fecha2, horaId, sedeId, tipoMoto, traeMoto, activeLockIds = [] }) => {
    if (!fecha1 || !fecha2 || !horaId || !sedeId || !tipoMoto) return null;

    const isLockedResource = (instructorId, motoAsignadaId) => activeLockIds.includes(buildLockId({ fecha1, horaId, instructorId, motoAsignadaId }));

    const availableInstructors = instructores
      .filter(i => i.activo && (i.sedes || []).includes(sedeId))
      .filter(inst => !reservas.some(r => String(r.instructorId) === String(inst.id) && isReservationConflict(r, fecha1, fecha2, horaId)));

    if (availableInstructors.length === 0) return null;

    const sortedInstructors = [...availableInstructors].sort((a, b) => (a.esPrincipal === b.esPrincipal ? 0 : a.esPrincipal ? -1 : 1));

    if (traeMoto === 'Sí') {
      const instructor = sortedInstructors.find(inst => !isLockedResource(inst.id, null));
      return instructor ? { instructorId: instructor.id, motoAsignadaId: null } : null;
    }

    const motosDelTipo = (motos||[]).filter(m => m.tipo === tipoMoto && m.activa && (m.sedes || []).includes(sedeId));
    if (motosDelTipo.length === 0) return null;

    const occupiedMotoIds = reservas
      .filter(r => isReservationConflict(r, fecha1, fecha2, horaId) && r.traeMoto !== 'Sí')
      .map(r => String(r.motoAsignadaId));

    for (const instructor of sortedInstructors) {
      const motoAsignada = motosDelTipo.find(m => !occupiedMotoIds.includes(String(m.id)) && !isLockedResource(instructor.id, m.id));
      if (motoAsignada) {
        return { instructorId: instructor.id, motoAsignadaId: motoAsignada.id };
      }
    }

    return null;
  };

  const calcularBaseUSD = (sedeId, sabeBici, traeMoto) => {
    let total = Number(config.precioBase) || 0;
    const s = sedes.find(x => String(x.id) === String(sedeId));
    if (s?.nombre === 'Guarenas') total += Number(config.recargoGuarenas) || 0; 
    if (sabeBici === 'No') total += Number(config.recargoSinBici) || 0;
    if (traeMoto === 'Sí') total -= Number(config.descuentoMotoPropia) || 0;
    total -= Number(config.descuentoPromo) || 0;
    return total > 0 ? total : 0;
  };

  const asignarInstructorLogica = (fecha1, fecha2, horaId, sedeId) => {
    const resources = findAvailableResources({ fecha1, fecha2, horaId, sedeId, tipoMoto: 'Sincrónica', traeMoto: 'No' });
    return resources?.instructorId || null;
  };

  const handleSaveInstructorSeguro = async (datos) => {
    if(datos.esPrincipal) {
       for(let inst of instructores) {
          if(String(inst.id) !== String(datos.id) && inst.esPrincipal) await saveInstructor({...inst, esPrincipal: false});
       }
    }
    await saveInstructor(datos);
  };

  const contextValue = {
    config, saveConfig, sedes, saveSede, horarios, saveHorario, cursos, saveCurso, instructores, saveInstructor, handleSaveInstructorSeguro,
    proveedores, saveProveedor, motos, saveMoto, reservas, saveReserva, movimientos, saveMovimiento, admins, saveAdmin,
    view, setView, user, setUser, toast, showToast, autoLoginData, setAutoLoginData, calcularBaseUSD, asignarInstructorLogica,
    findAvailableResources, getTodayStr, isReservaActiva, refreshExchangeRates, rateFetchError, saveReservaSeguro, authReady,
    createScheduleLock, fetchActiveLocks, releaseScheduleLock, confirmReservaConLock
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};