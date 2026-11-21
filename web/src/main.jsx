import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './estilos.css';
import { api, setToken, getToken, Sesion } from './api.js';
import { Layout } from './components/ui.jsx';
import { Landing } from './pages/Landing.jsx';
import { Onboarding } from './pages/Onboarding.jsx';
import { Inicio } from './pages/Inicio.jsx';
import { Shorts } from './pages/Shorts.jsx';
import { Ver } from './pages/Ver.jsx';
import { Aprender } from './pages/Aprender.jsx';
import { Clases, Curso } from './pages/Clases.jsx';
import { Leccion } from './pages/Leccion.jsx';
import { Aportar } from './pages/Aportar.jsx';

function App() {
  const [ses, setSes] = useState({ cargando: !!getToken(), usuario: null, perfil: null });
  useEffect(() => {
    if (!getToken()) return;
    api('/yo').then((d) => setSes({ cargando: false, ...d })).catch(() => { setToken(null); setSes({ cargando: false, usuario: null }); });
  }, []);
  const valor = {
    ...ses,
    entrar: (d) => { setToken(d.token); setSes({ cargando: false, usuario: d.usuario, perfil: d.perfil }); },
    setPerfil: (perfil) => setSes((s) => ({ ...s, perfil })),
    salir: () => { setToken(null); setSes({ cargando: false, usuario: null, perfil: null }); },
  };
  if (ses.cargando) return null;
  if (!ses.usuario) return <Sesion.Provider value={valor}><Landing /></Sesion.Provider>;
  if (ses.usuario.rol === 'alumno' && !ses.perfil) return <Sesion.Provider value={valor}><Onboarding /></Sesion.Provider>;
  return (
    <Sesion.Provider value={valor}>
      <Layout>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/shorts" element={<Shorts />} />
          <Route path="/shorts/:id" element={<Shorts />} />
          <Route path="/ver/:id" element={<Ver />} />
          <Route path="/aprender" element={<Aprender />} />
          <Route path="/clases" element={<Clases />} />
          <Route path="/curso/:id" element={<Curso />} />
          <Route path="/leccion/:id" element={<Leccion />} />
          <Route path="/perfil" element={<Onboarding editar />} />
          <Route path="/aportar" element={<Aportar />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Sesion.Provider>
  );
}

createRoot(document.getElementById('root')).render(<BrowserRouter><App /></BrowserRouter>);
