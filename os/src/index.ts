import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import * as extractImport from 'extract-zip';
import {ChildProcessByStdio, spawn} from 'child_process';
import {download} from './utils/download';
import {Task} from './interfaces/task.interface';
import {Readable, Writable} from 'node:stream';

const extract = extractImport.default;

admin.initializeApp({
  credential: admin.credential.cert('serviceAccountKey.json'),
  databaseURL: 'https://jp-server-manager-default-rtdb.europe-west1.firebasedatabase.app'
});

class ServerManager {

  configuration: {
    id: string;
  };

  activeTasks: {
    [id: string]: {
      directory: string;
      process: ChildProcessByStdio<Writable, Readable, Readable>;
      task: Task;
      memoryUsageInterval: NodeJS.Timer;
    }
  } = {};

  constructor() {
    this._parseConfiguration();
    this._startPing();
    this._listenForTasks();
  }

  stopTask(id: string) {
    if (!this.activeTasks[id]) {
      return;
    }

    this._stopPingMemoryUsage(id);

    this.activeTasks[id].process.stdout.destroy();
    this.activeTasks[id].process.stderr.destroy();
    this.activeTasks[id].process.kill('SIGINT');
    fs.rmSync(this.activeTasks[id].directory, {
      recursive: true,
      force: true
    });
    delete this.activeTasks[id];
  }

  private _parseConfiguration() {
    try {
      const configurationContent = fs.readFileSync(path.resolve(__dirname, '../configuration.json'), 'utf-8');
      this.configuration = JSON.parse(configurationContent);
    } catch (error) {
      console.log(`Error while parsing configuration file`, error);
      return;
    }
  }

  private _startPingMemoryUsage(taskId: string) {
    const memoryUsage = () => {
      admin.database().ref(`/devices/${this.configuration.id}/memory/${taskId}`).set(process.memoryUsage().rss).catch((error) => {
        console.log(`Failed to ping memory usage for task "${taskId}"`, error);
      });
    };
    memoryUsage();
    this.activeTasks[taskId].memoryUsageInterval = setInterval(() => {
      memoryUsage();
    }, 3000);
  }

  private _stopPingMemoryUsage(task) {
    clearInterval(this.activeTasks[task].memoryUsageInterval);
  }

  private _startPing() {
    const writePing = () => {
      admin.database().ref(`/devices/${this.configuration.id}/lastActiveOn`).set(Date.now()).catch((error) => {
        console.log(`Failed to ping device lastActiveOn`, error);
      });
    };
    writePing();
    setInterval(() => {
      writePing();
    }, 15000);

  }

  private _listenForTasks() {
    admin
      .firestore()
      .collection('tasks')
      .where('active', '==', true)
      .where('devices', 'array-contains', this.configuration.id)
      .onSnapshot((snapshot) => {
        const tasks = snapshot.docs.map((doc) => {
          return {
            id: doc.id,
            ...doc.data()
          } as Task;
        });

        const activeTasksIds = Object.keys(this.activeTasks);
        const newTasksIds = tasks.map((task) => task.id);

        const inactiveTasksIds = activeTasksIds.filter(task => !newTasksIds.includes(task));

        for (const inactiveTaskId of inactiveTasksIds) {
          this.stopTask(inactiveTaskId);
        }

        const fields = ['active', 'file'];
        for (const task of tasks) {
          if (this.activeTasks[task.id]) {

            const hasChange = fields.some((field) => {
              return this.activeTasks[task.id].task[field] !== task[field];
            });

            if (hasChange) {
              this.stopTask(task.id);
            } else {
              continue;
            }
          }

          this._startTask(task).catch((error) => {
            console.log(`Error while running task: "${task.id}"`, error);
          });
        }
      });
  }

  private async _startTask(task: Task) {
    /**
     * Check for already running task and kill it
     */
    if (this.activeTasks[task.id]) {
      this.stopTask(task.id);
    }

    const tmpDirectory = fs.mkdtempSync('server-manager');
    const taskDirectory = path.resolve(tmpDirectory, task.id);
    const extractedTaskDirectory = path.resolve(taskDirectory, 'extracted');

    if (!fs.existsSync(extractedTaskDirectory)) {
      fs.mkdirSync(extractedTaskDirectory, {
        recursive: true
      });
    }

    const fileName = path.resolve(taskDirectory, 'archive.zip');
    await download(task.file, fileName);
    await extract(fileName, {
      dir: path.resolve(taskDirectory, 'extracted')
    });

    /**
     * Detect file system and run corresponding setup
     */
    const platform = process.platform;

    const startUpScript = platform === 'win32' ? {
      command: 'setup.bat',
      args: []
    } : {
      command: 'sh',
      args: ['setup.sh']
    };

    this.activeTasks[task.id] = {
      task,
      directory: tmpDirectory,
      process: spawn(startUpScript.command, startUpScript.args, {
        detached: true,
        cwd: extractedTaskDirectory
      }),
      memoryUsageInterval: null
    };
    this._startPingMemoryUsage(task.id);

    this.activeTasks[task.id].process.on('exit', () => {
      this.stopTask(task.id);
    });

    // this.activeTasks[task.id].process.stdout.pipe(process.stdout);
    // this.activeTasks[task.id].process.stderr.pipe(process.stderr);
  }
}

const manager = new ServerManager();

function cleanup() {
  const tasks = Object.values(manager.activeTasks);
  for (const task of tasks) {
    manager.stopTask(task.task.id);
  }
}


process.on('exit', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGUSR1', cleanup);
process.on('SIGUSR2', cleanup);
process.on('uncaughtException', cleanup);