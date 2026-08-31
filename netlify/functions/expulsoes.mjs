import { getStore } from '@netlify/blobs';

const LIMITE_REGISTROS = 300;
const TAMANHO_MAX_BBCODE = 20000;

const SENHA_EXCLUSAO = 'CSLIM3';

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

async function podarAntigos(store) {
  const lista = await store.list({ consistency: 'strong' });
  const chaves = lista.blobs.map(function (b) { return b.key; }).sort();
  const excedente = chaves.length - LIMITE_REGISTROS;
  if (excedente <= 0) return;

  await Promise.all(chaves.slice(0, excedente).map(function (chave) {
    return store.delete(chave).catch(function () { });
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
  podarAntigos(store).catch(function () { });

  return resposta({ registro: registro }, 201);
}

async function tratarDelete(store, requisicao) {
  let bruto;
  try {
    bruto = await requisicao.json();
  } catch (erro) {
    return resposta({ erro: 'JSON inválido.' }, 400);
  }

  const id = limparTexto(bruto && bruto.id, 60);
  const senha = typeof (bruto && bruto.senha) === 'string' ? bruto.senha : '';

  if (senha !== SENHA_EXCLUSAO) return resposta({ erro: 'Senha incorreta.' }, 401);
  if (!id) return resposta({ erro: 'Informe o registro a excluir.' }, 400);

  const lista = await store.list({ consistency: 'strong' });
  for (const blob of lista.blobs) {
    const registro = await store.get(blob.key, { type: 'json', consistency: 'strong' }).catch(function () { return null; });
    if (registro && registro.id === id) {
      await store.delete(blob.key);
      return resposta({ ok: true });
    }
  }

  return resposta({ erro: 'Registro não encontrado (talvez já tenha sido excluído).' }, 404);
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
    if (requisicao.method === 'DELETE') return await tratarDelete(store, requisicao);
    return resposta({ erro: 'Método não permitido.' }, 405);
  } catch (erro) {
    return resposta({ erro: 'Falha inesperada ao acessar o histórico.' }, 500);
  }
}
