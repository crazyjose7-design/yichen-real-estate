import {spawnSync} from 'node:child_process';
const r=spawnSync(process.execPath,['scripts/validate-regulatory-data.mjs'],{encoding:'utf8'});
process.stdout.write(r.stdout);process.stderr.write(r.stderr);if(r.status!==0)process.exit(r.status??1);
