import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from '@clerk/react';
import { ANON_DAILY_LIMIT, getAnonymousPlaysRemaining } from '../lib/playLimit';
import { useEffect, useState } from 'react';

/** Barra superior: auth Clerk + aviso de límite anónimo */
export function AuthBar() {
  const { user, isSignedIn } = useUser();
  const [remaining, setRemaining] = useState(ANON_DAILY_LIMIT);

  useEffect(() => {
    if (!isSignedIn) setRemaining(getAnonymousPlaysRemaining());
  }, [isSignedIn]);

  useEffect(() => {
    const onFocus = () => {
      if (!isSignedIn) setRemaining(getAnonymousPlaysRemaining());
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [isSignedIn]);

  return (
    <div className="pointer-events-auto absolute top-3 right-3 z-20 flex items-center gap-2">
      <Show when="signed-out">
        <div className="hidden sm:block text-xs text-slate-600 bg-white/90 backdrop-blur rounded-lg px-2 py-1 shadow border border-slate-200">
          Invitado · {remaining}/{ANON_DAILY_LIMIT} partidas hoy
        </div>
        <SignInButton mode="modal">
          <button
            type="button"
            className="text-sm font-medium bg-white/95 hover:bg-white border border-slate-200 shadow rounded-lg px-3 py-1.5 text-slate-800"
          >
            Entrar
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button
            type="button"
            className="text-sm font-medium bg-blue-600 hover:bg-blue-700 shadow rounded-lg px-3 py-1.5 text-white"
          >
            Registro
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <div className="hidden sm:block text-xs text-slate-600 bg-white/90 backdrop-blur rounded-lg px-2 py-1 shadow border border-slate-200">
          {user?.firstName || user?.username || 'Jugador'} · ilimitado
        </div>
        <UserButton />
      </Show>
    </div>
  );
}

/** Variante sin Clerk (si falta la publishable key) */
export function AuthBarDisabled() {
  const [remaining, setRemaining] = useState(ANON_DAILY_LIMIT);
  useEffect(() => {
    setRemaining(getAnonymousPlaysRemaining());
  }, []);
  return (
    <div className="pointer-events-auto absolute top-3 right-3 z-20">
      <div className="text-xs text-slate-600 bg-white/90 backdrop-blur rounded-lg px-2 py-1 shadow border border-slate-200">
        Invitado · {remaining}/{ANON_DAILY_LIMIT} partidas hoy · Auth no configurada
      </div>
    </div>
  );
}
