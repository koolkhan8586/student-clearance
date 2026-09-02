import { useFeeApp } from './hooks/useFeeApp';
import { AppShell } from './components/Layout/AppShell';
import { LoginPage } from './components/LoginPage';

export default function App() {
  const app = useFeeApp();

  if (!app.user) {
    return <LoginPage loginData={app.loginData} setLoginData={app.setLoginData} onSubmit={app.handleLogin} />;
  }

  return <AppShell app={app} />;
}
