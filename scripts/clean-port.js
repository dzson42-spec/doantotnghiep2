import { execSync } from 'child_process';

function cleanPort(port = 5173) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
      const lines = output.trim().split('\n');
      const killed = new Set();
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0' && pid !== String(process.pid) && !killed.has(pid)) {
          killed.add(pid);
          try {
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
            console.log(`[CineVite] Đã giải phóng tiến trình cũ chiếm cổng ${port} (PID: ${pid})`);
          } catch {
            // Ignore if already terminated
          }
        }
      }
    }
  } catch {
    // Port is already free
  }
}

cleanPort(5173);
