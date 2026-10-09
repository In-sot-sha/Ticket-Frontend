import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

function lanIpv4s(): string[] {
  const ips = new Set<string>();
  for (const list of Object.values(os.networkInterfaces())) {
    for (const net of list ?? []) {
      const family = net.family as string | number;
      if ((family === 'IPv4' || family === 4) && !net.internal) ips.add(net.address);
    }
  }
  return [...ips];
}

function ensureCerts(dir: string, ips: string[]) {
  fs.mkdirSync(dir, { recursive: true });
  const stamp = ips.slice().sort().join(',');
  const stampPath = path.join(dir, 'ips.txt');
  const caCrt = path.join(dir, 'ca.crt');
  const serverCrt = path.join(dir, 'server.crt');
  const serverKey = path.join(dir, 'server.key');
  if (
    fs.existsSync(stampPath) &&
    fs.readFileSync(stampPath, 'utf8') === stamp &&
    fs.existsSync(caCrt) &&
    fs.existsSync(serverCrt) &&
    fs.existsSync(serverKey)
  ) {
    return { caCrt, serverCrt, serverKey };
  }

  const caKey = path.join(dir, 'ca.key');
  const caCnf = path.join(dir, 'ca.cnf');
  const serverCnf = path.join(dir, 'server.cnf');
  const csr = path.join(dir, 'server.csr');
  const alt = ['DNS.1 = localhost', 'IP.1 = 127.0.0.1', ...ips.map((ip, i) => `IP.${i + 2} = ${ip}`)].join('\n');

  fs.writeFileSync(
    caCnf,
    `[req]
distinguished_name = dn
x509_extensions = v3_ca
prompt = no
[dn]
CN = PartyStorm Dev
[v3_ca]
basicConstraints = critical,CA:TRUE
keyUsage = critical,keyCertSign,cRLSign
subjectKeyIdentifier = hash
`,
  );
  fs.writeFileSync(
    serverCnf,
    `[v3_req]
basicConstraints = CA:FALSE
keyUsage = digitalSignature,keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt
[alt]
${alt}
`,
  );

  execFileSync('openssl', ['genrsa', '-out', caKey, '2048']);
  execFileSync('openssl', [
    'req', '-x509', '-new', '-nodes', '-key', caKey, '-sha256', '-days', '800', '-out', caCrt, '-config', caCnf,
  ]);
  execFileSync('openssl', ['genrsa', '-out', serverKey, '2048']);
  execFileSync('openssl', ['req', '-new', '-key', serverKey, '-out', csr, '-subj', '/CN=partystorm.local']);
  execFileSync('openssl', [
    'x509', '-req', '-in', csr, '-CA', caCrt, '-CAkey', caKey, '-CAcreateserial',
    '-out', serverCrt, '-days', '800', '-sha256', '-extfile', serverCnf, '-extensions', 'v3_req',
  ]);
  fs.writeFileSync(stampPath, stamp);
  return { caCrt, serverCrt, serverKey };
}

/** Commented out in vite.config.ts. Uncomment `server.https` there to use this again. */
export function devHttpsOptions(certDir: string): { key: Buffer; cert: Buffer } {
  const certs = ensureCerts(certDir, lanIpv4s());
  return {
    key: fs.readFileSync(certs.serverKey),
    cert: Buffer.concat([
      fs.readFileSync(certs.serverCrt),
      Buffer.from('\n'),
      fs.readFileSync(certs.caCrt),
    ]),
  };
}
