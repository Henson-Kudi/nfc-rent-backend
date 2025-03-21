import logger from '@/common/utils/logger';
import { exec } from 'child_process';
import path from 'path';

// Function to execute shell commands
export function runCommand(command: string) {
  return new Promise((resolve, reject) => {
    exec(
      command,
      { cwd: path.resolve(__dirname, '../../') },
      (error, stdout, stderr) => {
        if (error) {
          logger.error(`❌ Error: ${stderr}`);
          reject(error);
        } else {
          logger.info(`✅ Success: ${stdout}`);
          resolve(stdout);
        }
      }
    );
  });
}
