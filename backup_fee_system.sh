#!/bin/bash

# ==============================================
# Student Fee System - Complete Backup Script
# Backs up: Database, Website Files, Nginx Config
# Uploads to: Google Drive via rclone
# ==============================================

# ----------------------------
# Configuration - EDIT THESE
# ----------------------------

# Database Settings
DB_USER="koolkhan"
DB_PASS="Mangohair@197"
DB_NAME="fee_system"

# Website Directory
WEB_ROOT="/var/www/scs"

# Nginx Config
NGINX_CONFIG="/etc/nginx/sites-available/scs.uolcc.edu.pk"
NGINX_CONFIG_ENABLED="/etc/nginx/sites-enabled/scs.uolcc.edu.pk"

# Rclone Settings
RCLONE_REMOTE_NAME="gdrive"  # Must match your rclone config name
RCLONE_FOLDER="student_fee_system"  # Folder name in Google Drive

# Backup Retention (local backups)
KEEP_LOCAL_BACKUPS=3  # Keep last 7 days locally

# ----------------------------
# Script Starts Here
# ----------------------------

# Timestamp for this backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/fee_system_backup_${TIMESTAMP}"
LOCAL_BACKUP_ROOT="/var/backups/fee_system"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Student Fee System Backup Script${NC}"
echo -e "${GREEN}Started at: $(date)${NC}"
echo -e "${GREEN}========================================${NC}"

# Create backup directories
echo -e "${YELLOW}Creating backup directories...${NC}"
mkdir -p ${BACKUP_DIR}/{database,files,nginx}
mkdir -p ${LOCAL_BACKUP_ROOT}

# ----------------------------
# 1. Backup Database
# ----------------------------
echo -e "${YELLOW}1. Backing up MySQL database...${NC}"
DB_BACKUP_FILE="${BACKUP_DIR}/database/${DB_NAME}_${TIMESTAMP}.sql"

if mysqldump -u ${DB_USER} -p${DB_PASS} ${DB_NAME} > ${DB_BACKUP_FILE} 2>/dev/null; then
    echo -e "${GREEN}   ✅ Database backup successful: ${DB_BACKUP_FILE}${NC}"
    # Compress database backup
    gzip ${DB_BACKUP_FILE}
    echo -e "${GREEN}   ✅ Database compressed${NC}"
else
    echo -e "${RED}   ❌ Database backup FAILED${NC}"
    exit 1
fi

# ----------------------------
# 2. Backup Website Files
# ----------------------------
echo -e "${YELLOW}2. Backing up website files...${NC}"
FILES_BACKUP="${BACKUP_DIR}/files/website_files_${TIMESTAMP}.tar.gz"

if tar -czf ${FILES_BACKUP} -C ${WEB_ROOT} . 2>/dev/null; then
    echo -e "${GREEN}   ✅ Website files backup successful: ${FILES_BACKUP}${NC}"
else
    echo -e "${RED}   ❌ Website files backup FAILED${NC}"
    exit 1
fi

# ----------------------------
# 3. Backup Nginx Configuration
# ----------------------------
echo -e "${YELLOW}3. Backing up Nginx configuration...${NC}"
NGINX_BACKUP="${BACKUP_DIR}/nginx/nginx_config_${TIMESTAMP}.tar.gz"

if tar -czf ${NGINX_BACKUP} ${NGINX_CONFIG} ${NGINX_CONFIG_ENABLED} 2>/dev/null; then
    echo -e "${GREEN}   ✅ Nginx config backup successful: ${NGINX_BACKUP}${NC}"
else
    echo -e "${RED}   ❌ Nginx config backup FAILED${NC}"
    exit 1
fi

# ----------------------------
# 4. Create Combined Archive
# ----------------------------
echo -e "${YELLOW}4. Creating combined backup archive...${NC}"
COMBINED_BACKUP="${LOCAL_BACKUP_ROOT}/full_backup_${TIMESTAMP}.tar.gz"

if tar -czf ${COMBINED_BACKUP} -C ${BACKUP_DIR} . 2>/dev/null; then
    echo -e "${GREEN}   ✅ Combined backup created: ${COMBINED_BACKUP}${NC}"
else
    echo -e "${RED}   ❌ Combined backup FAILED${NC}"
    exit 1
fi

# ----------------------------
# 5. Upload to Google Drive with rclone
# ----------------------------
echo -e "${YELLOW}5. Uploading to Google Drive...${NC}"

# Check if rclone is configured
if ! rclone listremotes | grep -q "${RCLONE_REMOTE_NAME}"; then
    echo -e "${RED}   ❌ Rclone remote '${RCLONE_REMOTE_NAME}' not found!${NC}"
    echo -e "${YELLOW}   Please configure rclone first with: rclone config${NC}"
else
    # Create backup info file
    INFO_FILE="${LOCAL_BACKUP_ROOT}/backup_info_${TIMESTAMP}.txt"
    cat > ${INFO_FILE} << EOF
Backup Information:
===================
Date: $(date)
Server: $(hostname)
Domain: scs.uolcc.edu.pk
Database: ${DB_NAME}
Files: ${WEB_ROOT}
Nginx Config: ${NGINX_CONFIG}

Contents:
- MySQL Database: ${DB_NAME}.sql.gz
- Website Files: website_files_${TIMESTAMP}.tar.gz  
- Nginx Config: nginx_config_${TIMESTAMP}.tar.gz

File Sizes:
$(ls -lh ${LOCAL_BACKUP_ROOT}/full_backup_${TIMESTAMP}.tar.gz)
EOF

    # Upload to Google Drive
    echo -e "${YELLOW}   Uploading to Google Drive folder: ${RCLONE_FOLDER}${NC}"
    
    # Create remote folder if it doesn't exist
    rclone mkdir ${RCLONE_REMOTE_NAME}:${RCLONE_FOLDER}
    
    # Upload the backup
    if rclone copy ${COMBINED_BACKUP} ${RCLONE_REMOTE_NAME}:${RCLONE_FOLDER}/backups/ --verbose --progress; then
        echo -e "${GREEN}   ✅ Backup uploaded to Google Drive successfully${NC}"
        
        # Also upload the info file
        rclone copy ${INFO_FILE} ${RCLONE_REMOTE_NAME}:${RCLONE_FOLDER}/ 2>/dev/null
        
        # List backups in Google Drive
        echo -e "${YELLOW}   Recent backups in Google Drive:${NC}"
        rclone ls ${RCLONE_REMOTE_NAME}:${RCLONE_FOLDER}/backups/ | tail -5
    else
        echo -e "${RED}   ❌ Failed to upload to Google Drive${NC}"
    fi
    
    # Clean up info file
    rm -f ${INFO_FILE}
fi

# ----------------------------
# 6. Cleanup Old Local Backups
# ----------------------------
echo -e "${YELLOW}6. Cleaning up old local backups...${NC}"
find ${LOCAL_BACKUP_ROOT} -name "full_backup_*.tar.gz" -type f -mtime +${KEEP_LOCAL_BACKUPS} -delete
echo -e "${GREEN}   ✅ Removed backups older than ${KEEP_LOCAL_BACKUPS} days${NC}"

# ----------------------------
# 7. Remove Temporary Directory
# ----------------------------
echo -e "${YELLOW}7. Cleaning up temporary files...${NC}"
rm -rf ${BACKUP_DIR}
echo -e "${GREEN}   ✅ Temporary files removed${NC}"

# ----------------------------
# 8. Summary
# ----------------------------
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Backup Completed Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Backup File: ${COMBINED_BACKUP}"
echo -e "File Size: $(du -h ${COMBINED_BACKUP} | cut -f1)"
echo -e "Google Drive Folder: ${RCLONE_REMOTE_NAME}:${RCLONE_FOLDER}/backups/"
echo -e "Completed at: $(date)"
echo -e "${GREEN}========================================${NC}"

# Optional: Send notification (uncomment if you have mail setup)
# echo "Backup completed successfully at $(date)" | mail -s "Backup Success: Student Fee System" your-email@example.com
