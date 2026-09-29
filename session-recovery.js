// Session Recovery & Backup System
// Provides automatic backup, version history, and recovery functionality

class SessionRecoveryManager {
    constructor() {
        this.BACKUP_KEY_PREFIX = 'session_backup_';
        this.HISTORY_KEY = 'session_history';
        this.MAX_BACKUPS_PER_SESSION = 10;
        this.BACKUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
    }

    // Create automatic backup of current session
    createBackup(sessionId, sessionData) {
        const timestamp = new Date().toISOString();
        const backupKey = `${this.BACKUP_KEY_PREFIX}${sessionId}_${Date.now()}`;
        
        const backup = {
            sessionId: sessionId,
            timestamp: timestamp,
            data: JSON.parse(JSON.stringify(sessionData)), // Deep copy
            size: JSON.stringify(sessionData).length
        };

        try {
            localStorage.setItem(backupKey, JSON.stringify(backup));
            this.updateHistoryIndex(sessionId, backupKey, timestamp);
            this.cleanOldBackups(sessionId);
            return { success: true, backupKey, timestamp };
        } catch (e) {
            console.error('Backup failed:', e);
            return { success: false, error: e.message };
        }
    }

    // Get all backups for a session
    getBackupsForSession(sessionId) {
        const backups = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(`${this.BACKUP_KEY_PREFIX}${sessionId}_`)) {
                try {
                    const backup = JSON.parse(localStorage.getItem(key));
                    backups.push({
                        key: key,
                        ...backup
                    });
                } catch (e) {
                    console.error('Error parsing backup:', key);
                }
            }
        }
        return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // Restore session from backup
    restoreFromBackup(backupKey) {
        try {
            const backupStr = localStorage.getItem(backupKey);
            if (!backupStr) {
                return { success: false, error: 'Backup not found' };
            }

            const backup = JSON.parse(backupStr);
            return { 
                success: true, 
                data: backup.data,
                timestamp: backup.timestamp
            };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    // Check for corrupt session and attempt recovery
    recoverCorruptSession(sessionId) {
        const session = localStorage.getItem(`session_${sessionId}`);
        
        if (!session) {
            const backups = this.getBackupsForSession(sessionId);
            if (backups.length > 0) {
                return {
                    recovered: true,
                    fromBackup: backups[0].key,
                    timestamp: backups[0].timestamp,
                    message: `Session wiederhergestellt von ${new Date(backups[0].timestamp).toLocaleString('de-DE')}`
                };
            }
            return { recovered: false, message: 'Keine Sicherung gefunden' };
        }

        try {
            JSON.parse(session);
            return { recovered: true, message: 'Session ist intakt' };
        } catch (e) {
            const backups = this.getBackupsForSession(sessionId);
            if (backups.length > 0) {
                return {
                    recovered: true,
                    fromBackup: backups[0].key,
                    timestamp: backups[0].timestamp,
                    message: `Beschädigte Session wiederhergestellt von ${new Date(backups[0].timestamp).toLocaleString('de-DE')}`
                };
            }
            return { recovered: false, message: 'Session beschädigt und keine Sicherung verfügbar' };
        }
    }

    // Export session as JSON file
    exportSession(sessionId) {
        const session = localStorage.getItem(`session_${sessionId}`);
        if (!session) {
            return { success: false, error: 'Session nicht gefunden' };
        }

        try {
            const data = JSON.parse(session);
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                sessionId: sessionId,
                data: data
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Session_${sessionId}_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            return { success: true, message: 'Session exportiert' };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    // Import session from JSON file
    importSession(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = JSON.parse(e.target.result);
                    if (!content.sessionId || !content.data) {
                        reject({ success: false, error: 'Ungültiges Session-Format' });
                        return;
                    }

                    const sessionId = content.sessionId;
                    localStorage.setItem(`session_${sessionId}`, JSON.stringify(content.data));
                    
                    // Create backup of imported session
                    this.createBackup(sessionId, content.data);

                    resolve({ 
                        success: true, 
                        sessionId: sessionId,
                        message: 'Session importiert'
                    });
                } catch (e) {
                    reject({ success: false, error: e.message });
                }
            };
            reader.onerror = () => {
                reject({ success: false, error: 'Datei konnte nicht gelesen werden' });
            };
            reader.readAsText(file);
        });
    }

    // Calculate storage usage
    getStorageUsage() {
        let totalSize = 0;
        const breakdown = {};

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const size = localStorage.getItem(key).length;
            totalSize += size;

            const category = key.split('_')[0];
            if (!breakdown[category]) breakdown[category] = 0;
            breakdown[category] += size;
        }

        return {
            totalSize: totalSize,
            totalSizeKB: (totalSize / 1024).toFixed(2),
            breakdown: breakdown,
            percentageUsed: ((totalSize / (5 * 1024 * 1024)) * 100).toFixed(2)
        };
    }

    // Clean old backups, keep only recent ones
    cleanOldBackups(sessionId) {
        const backups = this.getBackupsForSession(sessionId);
        
        if (backups.length > this.MAX_BACKUPS_PER_SESSION) {
            const toDelete = backups.length - this.MAX_BACKUPS_PER_SESSION;
            for (let i = 0; i < toDelete; i++) {
                try {
                    localStorage.removeItem(backups[backups.length - 1 - i].key);
                } catch (e) {
                    console.error('Error deleting old backup:', e);
                }
            }
        }
    }

    // Update history index
    updateHistoryIndex(sessionId, backupKey, timestamp) {
        try {
            let history = [];
            const historyStr = localStorage.getItem(this.HISTORY_KEY);
            if (historyStr) {
                history = JSON.parse(historyStr);
            }

            const sessionEntry = history.find(h => h.sessionId === sessionId);
            if (sessionEntry) {
                sessionEntry.lastBackup = timestamp;
                sessionEntry.backupCount = (sessionEntry.backupCount || 0) + 1;
            } else {
                history.push({
                    sessionId: sessionId,
                    lastBackup: timestamp,
                    backupCount: 1,
                    created: new Date().toISOString()
                });
            }

            localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
        } catch (e) {
            console.error('Error updating history:', e);
        }
    }

    // Get session history
    getSessionHistory() {
        try {
            const historyStr = localStorage.getItem(this.HISTORY_KEY);
            return historyStr ? JSON.parse(historyStr) : [];
        } catch (e) {
            return [];
        }
    }

    // Delete all backups for a session
    deleteAllBackups(sessionId) {
        let deleted = 0;
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key.startsWith(`${this.BACKUP_KEY_PREFIX}${sessionId}_`)) {
                try {
                    localStorage.removeItem(key);
                    deleted++;
                } catch (e) {
                    console.error('Error deleting backup:', key);
                }
            }
        }
        return { success: true, deleted: deleted };
    }
}

// Initialize global recovery manager
const recoveryManager = new SessionRecoveryManager();

// Optional: Set up automatic backups
function setupAutoBackup(sessionId, saveSessionFunction) {
    setInterval(() => {
        const sessionData = JSON.parse(localStorage.getItem(`session_${sessionId}`) || '{}');
        if (Object.keys(sessionData).length > 0) {
            recoveryManager.createBackup(sessionId, sessionData);
        }
    }, recoveryManager.BACKUP_INTERVAL);
}
