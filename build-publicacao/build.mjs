/*
  Gera a versão de produção do Gerador de Cartilhas em build-publicacao/site.

      node build-publicacao/build.mjs

  Copia tudo que o site usa de verdade (index.html, CSS, JavaScript, fontes,
  imagens e netlify.toml), mantendo os caminhos relativos para que a pasta
  "site" funcione como raiz de um domínio. HTML e CSS saem minificados.

  Não usa npm nem nenhuma dependência: só a biblioteca padrão do Node.
  No fim, confere se todo arquivo referenciado pelo HTML e pelo CSS realmente
  existe dentro de site/ e falha se faltar alguma coisa.
*/

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, statSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, relative, posix, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = dirname(AQUI);
const SITE = join(AQUI, 'site');

/* Não entram na publicação: pasta do próprio build, manuais, originais pesados
   e arquivos de apoio que o site não carrega. */
const FORA = [
  'build-publicacao',
  'documentacao',
  join('midia-imagens', 'originais'),
  'package-lock.json',
  'package.json',
  'node_modules',
  'netlify',
  '.git'
];

function ignorado(caminhoRelativo) {
  return FORA.some(item => caminhoRelativo === item || caminhoRelativo.startsWith(item + sep));
}

function copiarPasta(origem, destino, base) {
  for (const item of readdirSync(origem, { withFileTypes: true })) {
    const de = join(origem, item.name);
    const rel = relative(base, de);
    if (ignorado(rel) || item.name.startsWith('.')) continue;

    const para = join(destino, item.name);
    if (item.isDirectory()) {
      mkdirSync(para, { recursive: true });
      copiarPasta(de, para, base);
    } else {
      cpSync(de, para);
    }
  }
}

function minificarCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

function minificarHtml(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\n\s*/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function listarArquivos(pasta, base = pasta) {
  const saida = [];
  for (const item of readdirSync(pasta, { withFileTypes: true })) {
    const alvo = join(pasta, item.name);
    if (item.isDirectory()) saida.push(...listarArquivos(alvo, base));
    else saida.push(relative(base, alvo));
  }
  return saida;
}

/* ── 1. copia ─────────────────────────────────────────────────────────────── */
rmSync(SITE, { recursive: true, force: true });
mkdirSync(SITE, { recursive: true });
copiarPasta(RAIZ, SITE, RAIZ);

/* ── 2. minifica HTML e CSS já copiados ───────────────────────────────────── */
for (const arquivo of listarArquivos(SITE)) {
  const caminho = join(SITE, arquivo);
  if (arquivo.endsWith('.html')) writeFileSync(caminho, minificarHtml(readFileSync(caminho, 'utf8')));
  else if (arquivo.endsWith('.css')) writeFileSync(caminho, minificarCss(readFileSync(caminho, 'utf8')));
}

/* ── 3. confere se tudo que o site referencia foi mesmo copiado ───────────── */
const pendencias = [];

function conferir(referencia, arquivoOrigem) {
  const limpo = referencia.trim().replace(/^['"]|['"]$/g, '').split(/[?#]/)[0];
  if (!limpo || /^(https?:|data:|mailto:|#)/i.test(limpo)) return;

  const pastaDoArquivo = dirname(join(SITE, arquivoOrigem));
  const alvo = join(pastaDoArquivo, limpo.split(posix.sep).join(sep));
  if (!existsSync(alvo)) pendencias.push(limpo + '  (referenciado em ' + arquivoOrigem + ')');
}

for (const arquivo of listarArquivos(SITE)) {
  if (arquivo.endsWith('.html')) {
    const html = readFileSync(join(SITE, arquivo), 'utf8');
    for (const m of html.matchAll(/(?:src|href)\s*=\s*"([^"]+)"/g)) conferir(m[1], arquivo);
  } else if (arquivo.endsWith('.css')) {
    const css = readFileSync(join(SITE, arquivo), 'utf8');
    for (const m of css.matchAll(/url\(([^)]+)\)/g)) conferir(m[1], arquivo);
  }
}

/* ── 4. relatório ─────────────────────────────────────────────────────────── */
const arquivos = listarArquivos(SITE).sort();
const total = arquivos.reduce((soma, a) => soma + statSync(join(SITE, a)).size, 0);

console.log('build-publicacao/site gerado com ' + arquivos.length + ' arquivos (' + Math.round(total / 1024) + ' KB)\n');
for (const arquivo of arquivos) {
  console.log('  ' + arquivo.split(sep).join('/').padEnd(42) + Math.round(statSync(join(SITE, arquivo)).size / 1024) + ' KB');
}

if (!existsSync(join(SITE, 'index.html'))) {
  console.error('\nFALHA: index.html nao foi gerado.');
  process.exit(1);
}

if (pendencias.length) {
  console.error('\nFALHA: arquivos referenciados que nao estao em site/:');
  pendencias.forEach(p => console.error('  ' + p));
  process.exit(1);
}

console.log('\nOK: index.html presente e todos os recursos referenciados existem dentro de site/.');
console.log('Publique arrastando a pasta: ' + SITE);
