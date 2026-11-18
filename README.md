# AURELIA GRAND Hotel Management System

The project contains two independent React applications that share the existing Express/Mongoose API:

- `frontend/` — customer website, Vite development server on port 5173.
- `admin/` — separate hotel administration app, Vite development server on port 5174.
- `backend/` — shared Express API, port 4000 by default.

## Windows PowerShell

PowerShell may resolve `npm` to `npm.ps1` and block it under the current script execution policy. Use `npm.cmd` without weakening PowerShell security settings.

Run each app in its own terminal:

```powershell
Set-Location "D:\hotel\backend"
& "C:\Program Files\nodejs\npm.cmd" run dev
```

```powershell
Set-Location "D:\hotel\frontend"
& "C:\Program Files\nodejs\npm.cmd" run dev
```

```powershell
Set-Location "D:\hotel\admin"
& "C:\Program Files\nodejs\npm.cmd" run dev
```

Install dependencies within each project when needed:

```powershell
Set-Location "D:\hotel\frontend"
& "C:\Program Files\nodejs\npm.cmd" install
Set-Location "D:\hotel\admin"
& "C:\Program Files\nodejs\npm.cmd" install
Set-Location "D:\hotel\backend"
& "C:\Program Files\nodejs\npm.cmd" install
```

The admin app uses `VITE_API_URL` from `admin/.env`; copy `admin/.env.example` to `.env` if you need to override the API URL. The backend CORS allowlist uses `CLIENT_URL` for the customer origin and `ADMIN_CLIENT_URL` for the administration origin. Browser applications must not contain server secrets.

Administrator login is separate at the admin app's `/login` route. Admin accounts are provisioned using the backend's protected setup workflow; public customer registration cannot create admin roles. Admin access and permissions are also enforced by the backend.

See [backend/README.md](./backend/README.md) for API, database, environment, and test setup.
