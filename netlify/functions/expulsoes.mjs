/*
  API do histórico de expulsões — GET lista, POST registra.

  Fonte de verdade compartilhada entre todos os dispositivos: os registros ficam
  no Netlify Blobs (armazenamento de objetos do próprio Netlify, sem conta nem
  chave extra para configurar — as credenciais são injetadas automaticamente
  pelo runtime da função). Nenhum segredo é lido do frontend.

  Cada registro vira uma chave própria no store (nunca uma lista única reescrita a
  cada gravação): duas expulsões criadas ao mesmo tempo, em dispositivos diferentes,
  gravam em chaves diferentes e nunca disputam a mesma escrita — não existe janela em
  que uma grave por cima da outra.

  Só existe criação e leitura: excluir um registro aqui apagaria o histórico de
  todos os supervisores ao mesmo tempo, e este projeto ainda não tem uma forma
  confiável de autenticar quem está fazendo a chamada. Por isso não há rota de
  exclusão remota — a mesma restrição que já existia no histórico local.
*/

import { getStore } from '@netlify/blobs';

const LIMITE_REGISTROS = 300;
const TAMANHO_MAX_BBCODE = 20000;

const CABECALHOS = { 'Content-Type': 'application/json; charset=utf-8' };

function resposta(corpo, status) {
  return new Response(JSON.stringify(corpo), { status: status || 200, headers: CABECALHOS });
}

function limparTexto(valor, limite) {
  return String(valor || '').trim().replace(/[\[\]<>"']/g, '').slice(0, limite);
}

function validar(bruto) {
  if (!bruto || typeof bruto !== 'object') return { erro: 'Corpo da requisição inválido.' };

  const responsavel = limparTexto(bruto.responsavel, 40);
  const expulso = limparTexto(bruto.expulso, 40);
  const motivo = limparTexto(bruto.motivo, 80);
  const motivoCurto = limparTexto(bruto.motivoCurto, 40) || motivo;
  const motivoId = limparTexto(bruto.motivoId, 40);
  const bbcode = typeof bruto.bbcode === 'string' ? bruto.bbcode.trim().slice(0, TAMANHO_MAX_BBCODE) : '';

  if (!responsavel) return { erro: 'Informe o nick do responsável.' };
  if (!expulso) return { erro: 'Informe o nick do militar expulso.' };
  if (!motivo) return { erro: 'Informe o motivo da expulsão.' };
  if (responsavel.toLowerCase() === expulso.toLowerCase()) {
    return { erro: 'O responsável e o militar expulso não podem ser o mesmo nick.' };
  }

  return { dados: { responsavel, expulso, motivo, motivoCurto, motivoId, bbcode } };
}

/* Chave lexicograficamente ordenável pelo instante de criação (epoch em milissegundos,
   sem caracteres que precisem de escape) — permite achar os registros mais antigos sem
   precisar baixar o conteúdo de todos. */
function novaChave(criadoEm) {
  return 'reg_' + Date.parse(criadoEm) + '_' + crypto.randomUUID().slice(0, 8);
}

async function tratarGet(store) {
  const lista = await store.list({ consistency: 'strong' });
  const chaves = lista.blobs.map(function (b) { return b.key; });

  const registros = (await Promise.all(chaves.map(function (chave) {
    return store.get(chave, { type: 'json', consistency: 'strong' }).catch(function () { return null; });
  }))).filter(Boolean);

  registros.sort(function (a, b) { return Date.parse(b.criadoEm) - Date.parse(a.criadoEm); });
  return resposta({ registros: registros.slice(0, LIMITE_REGISTROS) });
}

/* Mantém o store com no máximo LIMITE_REGISTROS chaves, apagando as mais antigas.
   Não bloqueia a resposta do POST: falha aqui não significa que o registro não foi
   salvo, só que a faxina de itens antigos não rodou desta vez. */
async function podarAntigos(store) {
  const lista = await store.list({ consistency: 'strong' });
  const chaves = lista.blobs.map(function (b) { return b.key; }).sort();
  const excedente = chaves.length - LIMITE_REGISTROS;
  if (excedente <= 0) return;

  await Promise.all(chaves.slice(0, excedente).map(function (chave) {
    return store.delete(chave).catch(function () { /* melhor esforço */ });
  }));
}

async function tratarPost(store, requisicao) {
  let bruto;
  try {
    bruto = await requisicao.json();
  } catch (erro) {
    return resposta({ erro: 'JSON inválido.' }, 400);
  }

  const validado = validar(bruto);
  if (validado.erro) return resposta({ erro: validado.erro }, 400);

  const criadoEm = new Date().toISOString();
  const registro = Object.assign({
    id: crypto.randomUUID(),
    status: 'ativo',
    criadoEm: criadoEm,
    atualizadoEm: criadoEm
  }, validado.dados);

  await store.setJSON(novaChave(criadoEm), registro);
  podarAntigos(store).catch(function () { /* melhor esforço, não afeta a resposta */ });

  return resposta({ registro: registro }, 201);
}

export default async function handler(requisicao) {
  let store;
  try {
    store = getStore({ name: 'expulsoes', consistency: 'strong' });
  } catch (erro) {
    return resposta({ erro: 'Armazenamento indisponível no momento.' }, 503);
  }

  try {
    if (requisicao.method === 'GET') return await tratarGet(store);
    if (requisicao.method === 'POST') return await tratarPost(store, requisicao);
    return resposta({ erro: 'Método não permitido.' }, 405);
  } catch (erro) {
    return resposta({ erro: 'Falha inesperada ao acessar o histórico.' }, 500);
  }
}
