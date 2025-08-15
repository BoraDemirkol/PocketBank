# 🔒 PocketBank Security Guide

## **CRITICAL SECURITY REQUIREMENTS**

### **1. Environment Variables Management**
- **NEVER** commit credentials, API keys, or secrets to source control
- Use environment variables for all sensitive configuration
- Create `.env` files locally (already in `.gitignore`)

### **2. Required Environment Variables**

#### **Backend (.NET)**
```bash
# Database
DB_PASSWORD=your_actual_database_password

# JWT (Module3)
JWT_SECRET=your_secure_jwt_secret
SUPABASE_KEY=your_supabase_service_key
```

#### **Frontend (React)**
```bash
# Supabase
VITE_SUPABASE_URL=https://xfrgkzlugacowzcfthwk.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# API
VITE_API_BASE_URL=http://localhost:5271/api
```

### **3. Configuration Files**
- `appsettings.json` - Use placeholder values like `%DB_PASSWORD%`
- `appsettings.Development.json` - Same approach
- Program.cs handles environment variable substitution

### **4. Security Best Practices**
1. **Rotate Credentials**: Change all exposed passwords immediately
2. **Use Strong Secrets**: Generate cryptographically secure random strings
3. **Limit Access**: Use least privilege principle for database users
4. **Monitor Access**: Enable database access logging
5. **Regular Audits**: Review configuration files monthly

### **5. Emergency Response**
If credentials are exposed:
1. **Immediate**: Rotate all exposed credentials
2. **Investigate**: Check for unauthorized access
3. **Notify**: Inform security team and stakeholders
4. **Document**: Record incident and lessons learned

### **6. Development Workflow**
1. Create `.env` file locally with real credentials
2. Use placeholder values in committed config files
3. Environment variables are automatically substituted at runtime
4. Test with secure configuration before deployment

## **Current Status**
- ✅ Environment variable substitution implemented
- ✅ Hardcoded credentials removed from source
- ✅ Configuration templates created
- ⚠️ **URGENT**: Rotate exposed database passwords
- ⚠️ **URGENT**: Rotate exposed JWT secrets

## **Next Steps**
1. Set environment variables on your development machine
2. Test application functionality
3. Rotate all exposed credentials
4. Deploy with secure configuration
