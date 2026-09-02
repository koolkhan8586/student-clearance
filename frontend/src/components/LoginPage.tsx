import type { FeeAppState } from '../hooks/useFeeApp';

interface LoginPageProps {
  loginData: FeeAppState['loginData'];
  setLoginData: FeeAppState['setLoginData'];
  onSubmit: FeeAppState['handleLogin'];
}

export function LoginPage({ loginData, setLoginData, onSubmit }: LoginPageProps) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-lg flex items-center justify-center bg-white p-2">
            <img
              src="UOL-Green-V1.png"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.onerror = null;
                img.src = 'src/UOL-Green-V1.png';
              }}
              alt="UOL Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">LSAF Student Fee Management Software</h2>
        <p className="text-center text-gray-500 mb-6">Secure Login</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={loginData.username}
              onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
