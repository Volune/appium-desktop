import { BrowserWindow, Menu } from 'electron';
import Module from 'module';
import settings from '../shared/settings';
import path from 'path';
import { fs } from 'appium-support';
import i18n from '../configs/i18next.config';
import B from 'bluebird';

const isDev = process.env.NODE_ENV === 'development';


export async function fixGlobalPath () {
  const nodePath = process.env.NODE_PATH;
  if (nodePath) {
    let paths = nodePath.split(path.delimiter);
    paths = await B.filter(paths, async aPath => {
      return !!aPath && path.isAbsolute(aPath) && (await fs.exists(aPath));
    });
    Module.globalPaths.push(...paths);
  }
}


export function openBrowserWindow (route, opts) {
  const defaultOpts = {
    width: 1080,
    minWidth: 1080,
    height: 570,
    minHeight: 570,
    backgroundColor: '#f2f2f2',
    frame: 'customButtonsOnHover',
    webPreferences: {
      devTools: true
    }
  };

  let win = new BrowserWindow({
    ...defaultOpts,
    ...opts,
  });

  let htmlPath = path.resolve(__dirname, 'index.html');

  // on Windows we'll get backslashes, but we don't want these for a browser URL, so replace
  htmlPath = htmlPath.replace('\\', '/');
  htmlPath += `#/${route}`;
  win.loadURL(`file://${htmlPath}`);
  win.show();

  // If it's dev, go ahead and open up the dev tools automatically
  if (isDev) {
    win.openDevTools();
  }

  // Make 'devTools' available on right click
  win.webContents.on('context-menu', (e, props) => {
    const {x, y} = props;

    Menu.buildFromTemplate([{
      label: i18n.t('Inspect element'),
      click () {
        win.inspectElement(x, y);
      }
    }]).popup(win);
  });

  return win;
}


// Sets the environment variables to a combination of process.env and whatever
// the user saved
export async function setSavedEnv () {
  const savedEnv = await settings.get('ENV');
  // environment variable keys are case insensitive on Windows. Don't override process.env to keep the logic
  if (savedEnv) {
    Object.keys(savedEnv).forEach(key => {
      process.env[key] = savedEnv[key];
    });
  }
}