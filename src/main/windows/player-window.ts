import { BrowserWindow, shell } from 'electron';
import * as path from 'path';
import { CourseMetadata } from '../../shared/types';

/** Open a course in a dedicated player BrowserWindow */
export function openPlayerWindow(course: CourseMetadata): BrowserWindow {
  const playerWin = new BrowserWindow({
    width: 1280,
    height: 900,
    title: `${course.title} — CourseShelf Player`,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      // Required: SCORM HTML5 content needs cross-origin access to local file:// assets
      webSecurity: false,
    },
  });

  // Build the file URL to the launch file
  const launchUrl = `file://${path.join(course.cachePath, course.launchFile)}`;
  playerWin.loadURL(launchUrl);

  // Intercept new window requests (window.open) — redirect http(s) to system browser
  playerWin.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Intercept navigation to external URLs
  playerWin.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  return playerWin;
}
