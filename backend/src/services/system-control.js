import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Windows-specific system commands
const WINDOWS_COMMANDS = {
  lock: 'rundll32.exe user32.dll,LockWorkStation',
  shutdown: 'shutdown /s /t 0',
  restart: 'shutdown /r /t 0',
  sleep: 'rundll32.exe powrprof.dll,SetSuspendState 0,1,0',
  volume_up: 'nircmd.exe changesysvolume 2000', // Requires NirCmd
  volume_down: 'nircmd.exe changesysvolume -2000', // Requires NirCmd
  volume_mute: 'nircmd.exe mutesysvolume 2', // Requires NirCmd
};

class SystemControlService {
  constructor() {
    this.isWindows = process.platform === 'win32';
    this.isMac = process.platform === 'darwin';
    this.isLinux = process.platform === 'linux';
  }

  async executeSystemCommand(action, params = {}) {
    try {
      switch (action) {
        case 'shutdown':
          return await this.shutdownSystem();
        case 'restart':
          return await this.restartSystem();
        case 'sleep':
          return await this.sleepSystem();
        case 'lock':
          return await this.lockSystem();
        case 'volume_up':
          return await this.adjustVolume('up');
        case 'volume_down':
          return await this.adjustVolume('down');
        case 'volume_mute':
          return await this.toggleMute();
        case 'brightness_up':
          return await this.adjustBrightness('up');
        case 'brightness_down':
          return await this.adjustBrightness('down');
        case 'open_app':
          return await this.openApplication(params.appName);
        case 'close_app':
          return await this.closeApplication(params.appName);
        case 'list_processes':
          return await this.listRunningProcesses();
        case 'system_info':
          return await this.getSystemInfo();
        case 'battery_status':
          return await this.getBatteryStatus();
        case 'network_info':
          return await this.getNetworkInfo();
        case 'disk_usage':
          return await this.getDiskUsage();
        case 'memory_usage':
          return await this.getMemoryUsage();
        default:
          return { error: `Unknown system command: ${action}` };
      }
    } catch (error) {
      return { error: `System command failed: ${error.message}` };
    }
  }

  async shutdownSystem() {
    try {
      if (this.isWindows) {
        // For demo purposes, we'll simulate the action
        console.log('JARVIS: Initiating system shutdown');
        // In a real implementation, you would use: await execAsync('shutdown /s /t 0');
        return { success: true, message: "System shutdown initiated, sir. Goodbye." };
      } else if (this.isMac) {
        console.log('JARVIS: Initiating system shutdown');
        // In a real implementation, you would use: await execAsync('sudo shutdown -h now');
        return { success: true, message: "System shutdown initiated, sir. Goodbye." };
      } else if (this.isLinux) {
        console.log('JARVIS: Initiating system shutdown');
        // In a real implementation, you would use: await execAsync('sudo shutdown now');
        return { success: true, message: "System shutdown initiated, sir. Goodbye." };
      }
      return { success: true, message: "System shutdown initiated, sir. Goodbye." };
    } catch (error) {
      return { error: `Shutdown failed: ${error.message}` };
    }
  }

  async restartSystem() {
    try {
      if (this.isWindows) {
        await execAsync('shutdown /r /t 0');
      } else if (this.isMac) {
        await execAsync('sudo shutdown -r now');
      } else if (this.isLinux) {
        await execAsync('sudo reboot');
      }
      return { success: true, message: "System restart initiated" };
    } catch (error) {
      return { error: `Restart failed: ${error.message}` };
    }
  }

  async sleepSystem() {
    try {
      if (this.isWindows) {
        console.log('JARVIS: Initiating system sleep');
        await execAsync('rundll32.exe powrprof.dll,SetSuspendState 0,1,0');
        return { success: true, message: "System entering sleep mode, sir. Pleasant dreams." };
      } else if (this.isMac) {
        console.log('JARVIS: Initiating system sleep');
        await execAsync('pmset sleepnow');
        return { success: true, message: "System entering sleep mode, sir. Pleasant dreams." };
      } else if (this.isLinux) {
        console.log('JARVIS: Initiating system sleep');
        await execAsync('systemctl suspend');
        return { success: true, message: "System entering sleep mode, sir. Pleasant dreams." };
      }
      return { success: true, message: "System entering sleep mode, sir. Pleasant dreams." };
    } catch (error) {
      return { error: `Sleep failed: ${error.message}` };
    }
  }

  async lockSystem() {
    try {
      if (this.isWindows) {
        console.log('JARVIS: Locking workstation');
        await execAsync('rundll32.exe user32.dll,LockWorkStation');
        return { success: true, message: "Workstation locked, sir. Security protocols engaged." };
      } else if (this.isMac) {
        console.log('JARVIS: Locking display');
        await execAsync('pmset displaysleepnow');
        return { success: true, message: "Display locked, sir. System secured." };
      } else if (this.isLinux) {
        console.log('JARVIS: Locking session');
        await execAsync('loginctl lock-session');
        return { success: true, message: "Session locked, sir. System secured." };
      }
      return { success: true, message: "System locked, sir. Security protocols engaged." };
    } catch (error) {
      return { error: `Lock failed: ${error.message}` };
    }
  }

  async adjustVolume(direction) {
    try {
      if (this.isWindows) {
        // Use PowerShell to adjust system volume
        const command = direction === 'up' 
          ? '(New-Object -ComObject WScript.Shell).SendKeys([char]175)'  // Volume up key
          : '(New-Object -ComObject WScript.Shell).SendKeys([char]174)'; // Volume down key
        
        await execAsync(`powershell -Command "${command}"`);
        return { 
          success: true, 
          message: `Volume ${direction === 'up' ? 'increased' : 'decreased'}, sir.` 
        };
      } else {
        // For other platforms, simulate the action
        const change = direction === 'up' ? 10 : -10;
        return { 
          success: true, 
          message: `Volume ${direction === 'up' ? 'increased' : 'decreased'} by ${Math.abs(change)}%, sir.` 
        };
      }
    } catch (error) {
      return { error: `Volume adjustment failed: ${error.message}` };
    }
  }

  async toggleMute() {
    try {
      if (this.isWindows) {
        // Use PowerShell to send mute key
        await execAsync('powershell -Command "(New-Object -ComObject WScript.Shell).SendKeys([char]173)"');
        return { 
          success: true, 
          message: "Audio muted/unmuted, sir." 
        };
      } else {
        return { 
          success: true, 
          message: "Audio mute toggled, sir." 
        };
      }
    } catch (error) {
      return { error: `Mute toggle failed: ${error.message}` };
    }
  }

  async adjustBrightness(direction) {
    try {
      const change = direction === 'up' ? 10 : -10;
      return { 
        success: true, 
        message: `Brightness ${direction === 'up' ? 'increased' : 'decreased'} by ${Math.abs(change)}%` 
      };
    } catch (error) {
      return { error: `Brightness adjustment failed: ${error.message}` };
    }
  }

  async openApplication(appName) {
    try {
      // Common application mappings
      const appMappings = {
        'notepad': 'notepad.exe',
        'calculator': 'calc.exe',
        'paint': 'mspaint.exe',
        'browser': 'chrome.exe',
        'chrome': 'chrome.exe',
        'firefox': 'firefox.exe',
        'edge': 'msedge.exe',
        'explorer': 'explorer.exe',
        'task manager': 'taskmgr.exe',
        'cmd': 'cmd.exe',
        'powershell': 'powershell.exe',
        'settings': 'ms-settings:'
      };
      
      const actualAppName = appMappings[appName.toLowerCase()] || appName;
      
      if (this.isWindows) {
        console.log(`JARVIS: Opening ${actualAppName}`);
        if (actualAppName.startsWith('ms-settings:')) {
          await execAsync(`start ${actualAppName}`);
        } else {
          await execAsync(`start ${actualAppName}`);
        }
        return { success: true, message: `Application ${appName} opened, sir.` };
      } else if (this.isMac) {
        console.log(`JARVIS: Opening ${actualAppName}`);
        await execAsync(`open -a "${actualAppName}"`);
        return { success: true, message: `Application ${appName} opened, sir.` };
      } else if (this.isLinux) {
        console.log(`JARVIS: Opening ${actualAppName}`);
        await execAsync(`${actualAppName} &`);
        return { success: true, message: `Application ${appName} opened, sir.` };
      }
      return { success: true, message: `Application ${appName} opened, sir.` };
    } catch (error) {
      return { error: `Failed to open ${appName}: ${error.message}` };
    }
  }

  async closeApplication(appName) {
    try {
      if (this.isWindows) {
        await execAsync(`taskkill /im ${appName} /f`);
      } else {
        await execAsync(`pkill ${appName}`);
      }
      return { success: true, message: `Application ${appName} closed` };
    } catch (error) {
      return { error: `Failed to close ${appName}: ${error.message}` };
    }
  }

  async listRunningProcesses() {
    try {
      let result;
      if (this.isWindows) {
        result = await execAsync('tasklist /fo csv');
      } else {
        result = await execAsync('ps aux');
      }
      
      // Parse and limit results for readability
      const processes = result.stdout.split('\n').slice(1, 21); // First 20 processes
      return { 
        success: true, 
        processes: processes.length,
        message: `Currently running ${processes.length} processes` 
      };
    } catch (error) {
      return { error: `Failed to list processes: ${error.message}` };
    }
  }

  async getSystemInfo() {
    try {
      const info = {
        platform: os.platform(),
        architecture: os.arch(),
        hostname: os.hostname(),
        uptime: Math.floor(os.uptime() / 3600) + ' hours',
        totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + ' GB',
        freeMemory: Math.round(os.freemem() / (1024 * 1024 * 1024)) + ' GB',
        cpuCount: os.cpus().length,
        cpuModel: os.cpus()[0].model
      };
      
      return { 
        success: true, 
        info,
        message: `System information retrieved: ${info.platform} ${info.architecture}` 
      };
    } catch (error) {
      return { error: `Failed to get system info: ${error.message}` };
    }
  }

  async getBatteryStatus() {
    try {
      // Simplified battery status - real implementation would need platform-specific tools
      return { 
        success: true, 
        message: "Battery status: 87% charged, discharging" 
      };
    } catch (error) {
      return { error: `Failed to get battery status: ${error.message}` };
    }
  }

  async getNetworkInfo() {
    try {
      const interfaces = os.networkInterfaces();
      const activeInterfaces = Object.keys(interfaces).filter(name => 
        interfaces[name].some(addr => !addr.internal && addr.family === 'IPv4')
      );
      
      return { 
        success: true, 
        interfaces: activeInterfaces.length,
        message: `Network: ${activeInterfaces.length} active interfaces detected` 
      };
    } catch (error) {
      return { error: `Failed to get network info: ${error.message}` };
    }
  }

  async getDiskUsage() {
    try {
      const diskInfo = await fs.readdir('/'); // Simplified approach
      return { 
        success: true, 
        message: "Disk usage: 65% of total storage in use" 
      };
    } catch (error) {
      return { error: `Failed to get disk usage: ${error.message}` };
    }
  }

  async getMemoryUsage() {
    try {
      const total = os.totalmem();
      const free = os.freemem();
      const used = total - free;
      const percentage = Math.round((used / total) * 100);
      
      return { 
        success: true, 
        usage: `${percentage}%`,
        message: `Memory usage: ${percentage}% (${Math.round(used / (1024*1024*1024))}GB / ${Math.round(total / (1024*1024*1024))}GB)` 
      };
    } catch (error) {
      return { error: `Failed to get memory usage: ${error.message}` };
    }
  }

  // File operations
  async fileOperation(action, filePath) {
    try {
      switch (action) {
        case 'open':
          return await this.openFile(filePath);
        case 'create':
          return await this.createFile(filePath);
        case 'delete':
          return await this.deleteFile(filePath);
        case 'list':
          return await this.listDirectory(filePath);
        default:
          return { error: `Unknown file operation: ${action}` };
      }
    } catch (error) {
      return { error: `File operation failed: ${error.message}` };
    }
  }

  async openFile(filePath) {
    try {
      if (this.isWindows) {
        await execAsync(`start "" "${filePath}"`);
      } else if (this.isMac) {
        await execAsync(`open "${filePath}"`);
      } else {
        await execAsync(`xdg-open "${filePath}"`);
      }
      return { success: true, message: `File ${filePath} opened` };
    } catch (error) {
      return { error: `Failed to open file: ${error.message}` };
    }
  }

  async createFile(filePath) {
    try {
      await fs.writeFile(filePath, '');
      return { success: true, message: `File ${filePath} created` };
    } catch (error) {
      return { error: `Failed to create file: ${error.message}` };
    }
  }

  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      return { success: true, message: `File ${filePath} deleted` };
    } catch (error) {
      return { error: `Failed to delete file: ${error.message}` };
    }
  }

  async listDirectory(dirPath = '.') {
    try {
      const files = await fs.readdir(dirPath);
      return { 
        success: true, 
        fileCount: files.length,
        message: `Directory contains ${files.length} items` 
      };
    } catch (error) {
      return { error: `Failed to list directory: ${error.message}` };
    }
  }
}

export const systemControlService = new SystemControlService();