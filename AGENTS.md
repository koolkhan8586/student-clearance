# AGENTS.md

## Project overview

A single-product **Student Fee Management System** ("LSAF / SCS"):

- `index.html` — the entire frontend: a React SPA transpiled in-browser via Babel, with React/ReactDOM/Tailwind loaded from CDNs (so the browser needs internet). It calls the backend at the relative URL `api.php`.
- `api.php` — the PHP backend (PDO/MySQL). On each request it auto-creates the base tables and seeds an `admin` user. Handles all CRUD via a `GET` (load everything) / `POST {action,...}` JSON protocol.
- `check_db.php` — a standalone DB connectivity check page.
- `backup_fee_system.sh` — production backup helper (mysqldump + rclone); not needed for local dev.

There is **no build step, no package manager, and no dependency manifest** — it is plain PHP + a static HTML file served together from one web root.

Default login: **username `admin`, password `123`** (seeded automatically by `api.php`).

## Cursor Cloud specific instructions

The update script only guarantees the PHP/MySQL packages are present. MySQL data, the `fee_system` database, the `koolkhan` DB user, schema fixes, and MySQL config persist in the VM snapshot but **services are not auto-started**. After a fresh VM start you must start MySQL and the PHP dev server yourself.

### Start the services

```bash
# 1. Start MySQL (no systemd in this container; start the daemon directly)
sudo mkdir -p /var/run/mysqld && sudo chown mysql:mysql /var/run/mysqld
sudo mysqld_safe >/tmp/mysql.log 2>&1 &
sleep 10 && sudo mysqladmin ping

# 2. IMPORTANT: make the socket dir traversable by the non-root PHP process.
#    mysqld_safe resets /var/run/mysqld to 0700 on every start, which causes
#    PDO/mysqli "Permission denied [2002]" when connecting via the unix socket.
sudo chmod 755 /var/run/mysqld

# 3. Start the app (serves index.html + api.php from the repo root)
php -S 0.0.0.0:8000 -t /workspace
```

Then open `http://localhost:8000/index.html`.

### Database

`api.php` connects as `koolkhan` / `Mangohair@197` to the `fee_system` database on `localhost` (hardcoded in `api.php` and `check_db.php`). These DB credentials are app constants, not secrets to be provided.

### Non-obvious gotchas (do NOT "fix" by editing the app)

- **MySQL, not MariaDB.** The app targets MySQL; install `mysql-server` (MariaDB is acceptable for connectivity but shares the same prepared-statement caveat below).
- **`api.php`'s `ensureColumn()` auto-migrator is silently broken** on this stack: it runs `SHOW COLUMNS ... LIKE ?` with `PDO::ATTR_EMULATE_PREPARES => false`, which MySQL rejects (error 1064), and the failure is swallowed by a `catch`. As a result the extra columns it intends to add never get added on a fresh DB. The columns are therefore pre-created in the snapshot DB:
  - `students`: `mobile VARCHAR(50)`, `email VARCHAR(100)`, `total_package DECIMAL(10,2)`
  - `payments`: `bank VARCHAR(100)`
  If you ever recreate `fee_system` from scratch, re-add these columns or saving students/payments with those fields will fail.
- **Relaxed `sql_mode` is required.** Several queries rely on legacy loose typing (e.g. `delete_student` compares string `reg_no` against the integer `id` column), which errors under MySQL 8's default strict mode. `/etc/mysql/conf.d/zz-fee-system.cnf` sets `sql_mode=` (empty). Note the leftover `/etc/mysql/my.cnf` alternatives symlink points at `mariadb.cnf`, which only includes `conf.d/` (not `mysql.conf.d/`), so app DB config must live in `/etc/mysql/conf.d/`.
- **InnoDB IO must be tamed for this container's overlay filesystem.** Native async IO / `O_DIRECT` cause MySQL to fail on startup (`InnoDB OS error 122 on file 'close'`). `/etc/mysql/conf.d/zz-fee-system.cnf` also sets `innodb_use_native_aio=0`, `innodb_flush_method=fsync`, and `innodb_doublewrite=0`. A *fresh* `--initialize` works with these settings, but an InnoDB data dir created on a previous VM/snapshot may be unreadable after a restart and fail with the same error. If that happens, reinitialize a fresh data dir (`sudo mv /var/lib/mysql /var/lib/mysql.broken && sudo mkdir /var/lib/mysql && sudo chown mysql:mysql /var/lib/mysql && sudo mysqld --initialize-insecure --user=mysql`), start MySQL, then recreate the `fee_system` DB, the `koolkhan` user, and the extra columns listed above. (Dev data is disposable; re-seed via the API.)

### Lint / test / build

There is no linter, no test suite, and no build for this repo. "Running" the app = the two services above. Quick backend smoke test:

```bash
curl -s http://localhost:8000/api.php            # returns JSON with seeded admin user
```
