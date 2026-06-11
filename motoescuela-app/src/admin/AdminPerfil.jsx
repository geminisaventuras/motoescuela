import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContextValue';
import { Button, Input } from '../components/UI';
import { ChevronLeft, User, Phone, Hash, Mail, Lock, Check } from 'lucide-react';

const AdminPerfil = ({ setTab }) => {
  const { user, saveAdmin, showToast } = useContext(AppContext);
  const [form, setForm] = useState(user.data || {});

  const handleSave = async () => {
    await saveAdmin({ ...form, id: user.data.id });
    showToast('Perfil actualizado');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center mb-4">
        <button type="button" onClick={() => setTab('config')} className="p-2 bg-gray-200 rounded-full">
          <ChevronLeft size={20} />
        </button>
        <h3 className="font-bold text-lg">Mi Perfil</h3>
      </div>
      <Input label="Nombre" icon={User} value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
      <Input label="Apellido" icon={User} value={form.apellido} onChange={e => setForm({...form, apellido: e.target.value})} />
      <Input label="Cédula" icon={Hash} value={form.cedula} onChange={e => setForm({...form, cedula: e.target.value})} />
      <Input label="Teléfono" icon={Phone} value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} />
      <Input label="Email" icon={Mail} type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
      <Input label="Contraseña" icon={Lock} type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
      <Button onClick={handleSave} variant="success" icon={Check}>Guardar Cambios</Button>
    </div>
  );
};

export default AdminPerfil;
