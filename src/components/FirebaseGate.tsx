import { useState, type FormEvent, type ReactNode } from 'react';
import { AlertTriangle, Hospital, LogIn } from 'lucide-react';
import { missingFirebaseConfig } from '../services/firebase';
import { useFirebaseSession } from '../context/FirebaseSessionContext';
import './FirebaseGate.css';

export function FirebaseGate({ children }: { children: ReactNode }) {
  const { configured, loading, user, profile, profileError, signIn, signOutUser } = useFirebaseSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await signIn(email, password);
    } catch {
      setError('Sign-in failed. Verify your account details and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!configured) {
    return (
      <main className="firebase-gate">
        <section className="firebase-gate-card">
          <span className="firebase-gate-icon"><Hospital size={24} /></span>
          <p className="scenario-eyebrow">DATABASE SETUP REQUIRED</p>
          <h1>Connect HospitalFlow to Firebase</h1>
          <p>Application data is disabled until Firebase Authentication and Firestore are configured.</p>
          <ul>{missingFirebaseConfig.map((name) => <li key={name}><code>{name}</code></li>)}</ul>
          <div className="firebase-gate-warning"><AlertTriangle size={18} />Do not add real patient, staff, or clinical information to this prototype.</div>
        </section>
      </main>
    );
  }

  if (loading) {
    return <main className="firebase-gate"><p role="status">Checking secure facility access…</p></main>;
  }

  if (!user) {
    return (
      <main className="firebase-gate">
        <section className="firebase-gate-card">
          <span className="firebase-gate-icon"><Hospital size={24} /></span>
          <p className="scenario-eyebrow">HOSPITALFLOW ACCESS</p>
          <h1>Sign in to your facility</h1>
          <p>Accounts and facility roles must be provisioned by an administrator. Self-registration is disabled.</p>
          <form className="firebase-login-form" onSubmit={submit}>
            <label>Email<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
            {error && <p className="firebase-form-error" role="alert">{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={submitting}><LogIn size={16} />{submitting ? 'Signing in…' : 'Sign in'}</button>
          </form>
        </section>
      </main>
    );
  }

  if (!profile || profileError) {
    return (
      <main className="firebase-gate">
        <section className="firebase-gate-card">
          <span className="firebase-gate-icon"><AlertTriangle size={24} /></span>
          <p className="scenario-eyebrow">FACILITY ACCESS NOT AVAILABLE</p>
          <h1>Account setup required</h1>
          <p role="alert">{profileError || 'A facility profile could not be loaded.'}</p>
          <button className="btn btn-secondary" type="button" onClick={() => void signOutUser()}>Sign out</button>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
