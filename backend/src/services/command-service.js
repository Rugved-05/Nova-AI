import open from 'open';
import { systemControlService } from './system-control.js';

const CMD_REGEX = /\[CMD:(\w+)(?::([^\]]*))?\]/g;

export function parseCommands(text) {
  const commands = [];
  let match;
  while ((match = CMD_REGEX.exec(text)) !== null) {
    commands.push({ type: match[1], arg: match[2] || '' });
  }
  return commands;
}

export function stripCommands(text) {
  return text.replace(CMD_REGEX, '').replace(/\s{2,}/g, ' ').trim();
}

export async function executeCommand(command) {
  switch (command.type) {
    case 'open_url': {
      const url = command.arg.startsWith('http') ? command.arg : `https://${command.arg}`;
      await open(url);
      return { success: true, message: `Opened ${url}` };
    }
    case 'search': {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(command.arg)}`;
      await open(searchUrl);
      return { success: true, message: `Searching for "${command.arg}"` };
    }
    case 'time': {
      const now = new Date();
      return {
        success: true,
        message: `Current time: ${now.toLocaleTimeString()} | Date: ${now.toLocaleDateString()}`,
      };
    }
    case 'weather': {
      // Weather is handled in the main chat flow
      return { success: true, message: `Weather query for ${command.arg}` };
    }
    case 'news': {
      // News is handled in the main chat flow
      return { success: true, message: `News query for ${command.arg}` };
    }
    case 'system': {
      // Handle system commands (shutdown, restart, etc.)
      const result = await systemControlService.executeSystemCommand(command.arg);
      return result;
    }
    case 'file': {
      // Handle file operations (open, create, delete, etc.)
      const [action, filePath] = command.arg.split(':');
      const result = await systemControlService.fileOperation(action, filePath);
      return result;
    }
    default:
      return { success: false, message: `Unknown command: ${command.type}` };
  }
}
