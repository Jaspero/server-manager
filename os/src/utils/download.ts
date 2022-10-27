import * as fs from 'fs';
import axios from 'axios';

export function download(url: string, dest: string) {
  console.log(`Downloading to file '${dest}' from url '${url}'`);
  return new Promise<void>((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    axios({
      url,
      responseType: 'stream'
    }).then((stream) => {
      resolve();
      stream.data.pipe(file);
      let error: Error = null;

      file.on('error', (err) => {
        console.log('Error', err);
        error = err;
        file.close();
        fs.unlinkSync(dest);
        reject(error);
      });

      file.on('close', () => {
        if (!error) {
          resolve();
        }
      });
    });
  });
}