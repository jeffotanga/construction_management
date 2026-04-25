# MySQL Setup Guide for Windows

## Option 1: Using MySQL Community Server (Recommended)

### Step 1: Download MySQL Community Server
1. Go to: https://dev.mysql.com/downloads/mysql/
2. Select **Windows (x86, 64-bit, MSI Installer)**
3. Click "Download" (you don't need to sign up, just click "No thanks, just start my download")

### Step 2: Install MySQL Server
1. Run the installer (MySQLServer-x.x.msi)
2. Choose **Setup Type**: Select "Developer Default" or "Server only"
3. **MySQL Server Configuration**:
   - Port: `3306` (default)
   - Config Type: `Development Machine`
   - MySQL Server Instance Configuration:
     - TCP/IP Enabled ✓
     - Port: 3306
4. **MySQL Server User Configuration**:
   - Create user account: `root`
   - Password: Set to match your `.env` file (currently `your_password`)
   - Allow Windows Service to start MySQL
5. Complete the installation

### Step 3: Start MySQL Server
MySQL should start automatically as a Windows Service. To verify:
- Open **Services** (search for "Services")
- Look for "MySQL80" (or similar version)
- Ensure it shows **Running**

Or start manually from PowerShell:
```powershell
net start MySQL80
```

### Step 4: Verify Installation
Open PowerShell and run:
```powershell
mysql --version
```

Should display something like: `mysql  Ver 8.0.xx ...`

---

## Option 2: Using MySQL via WSL (Windows Subsystem for Linux)

### Step 1: Install WSL
```powershell
wsl --install
```

### Step 2: Install MySQL in WSL
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

### Step 3: Start MySQL Service
```bash
sudo service mysql start
```

### Step 4: Update .env for WSL Access
Change your `.env`:
```
DB_HOST=127.0.0.1
```

---

## Option 3: Using Docker (Advanced)

### Create `docker-compose.yml` in your project root:
```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: your_password
      MYSQL_DATABASE: construction_management
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

### Then run:
```powershell
docker-compose up -d
```

---

## Setup Your Construction Management Database

### After MySQL is Running:

1. **Open MySQL Command Line** (or PowerShell):
```powershell
mysql -h localhost -u root -p
```
When prompted, enter your password from `.env`

2. **Create the Database**:
```sql
CREATE DATABASE construction_management;
EXIT;
```

3. **Update Your .env File** (if different from defaults):
Edit `backend\.env`:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=construction_management
```

4. **Test Connection from Python**:
```powershell
cd c:\Users\Administrator\.vscode\cli\backend
.\venv\Scripts\activate
python diagnose.py
```

If successful, you should see: **✓ Database connection successful**

5. **Run the Seed Script**:
```powershell
python seed.py
```

---

## Troubleshooting

### "Can't connect to MySQL server"
- [ ] Is MySQL running? Check Services
- [ ] Is port 3306 in use? Check with: `netstat -ano | findstr :3306`
- [ ] Firewall blocking? Add MySQL to Windows Firewall exceptions
- [ ] Wrong password? Update `backend\.env`

### "Access denied for user 'root'@'localhost'"
- Reset root password: Use MySQL Installer → Reconfigure → Server Configuration

### "Database 'construction_management' doesn't exist"
Run in MySQL: `CREATE DATABASE construction_management;`

---

## Quick Check Commands

```powershell
# Check if MySQL service is running
Get-Service MySQL80

# List all databases
mysql -u root -p -e "SHOW DATABASES;"

# Check database size
mysql -u root -p -e "SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.tables WHERE table_schema = 'construction_management' GROUP BY table_schema;"
```
