'use strict';

const URL_API = '/api/expulsoes';
const TEMPO_TOAST = 2800;
const TEMPO_FEEDBACK = 2000;
const URL_AVATAR = 'https://www.habbo.com.br/habbo-imaging/avatarimage?user={NICK}&action=std&direction=2&head_direction=3&gesture=sml&size=m&headonly=1&img_format=png';

const $ = function (seletor) { return document.querySelector(seletor); };

const el = {
  formulario:      $('#formulario'),
  botaoGerar:      $('#formulario button[type="submit"]'),
  responsavel:     $('#campoResponsavel'),
  expulso:         $('#campoExpulso'),
  avatarResp:      $('#avatarResponsavel'),
  avatarExp:       $('#avatarExpulso'),
  erroResp:        $('#erroResponsavel'),
  erroExp:         $('#erroExpulso'),
  erroMotivo:      $('#erroMotivo'),
  selecao:         $('#selecaoMotivo'),
  gatilho:         $('#gatilhoMotivo'),
  listaMotivos:    $('#listaMotivos'),
  valorMotivo:     $('#valorMotivo'),
  fichaMotivo:     $('#fichaMotivo'),
  fichaResumo:     $('#fichaResumo'),
  fichaBase:       $('#fichaBase'),
  resultado:       $('#resultado'),
  saidaTitulo:     $('#saidaTitulo'),
  btnCopiarTitulo: $('#btnCopiarTitulo'),
  btnCopiarBBCode: $('#btnCopiarBBCode'),
  rodapeResultado: $('#rodapeResultado'),
  painelGerador:   $('#painelGerador'),
  painelRegistros: $('#painelRegistros'),
  listaRegistros:  $('#listaRegistros'),
  campoBusca:      $('#campoBusca'),
  btnAtualizar:    $('#btnAtualizarRegistros'),
  statusRegistros: $('#statusRegistros'),
  contador:        $('#contadorRegistros'),
  toast:           $('#toast'),
  toastTexto:      $('#toastTexto'),
  emblema:         $('#emblemaImagem'),
  modeloRegistro:  $('#modeloRegistro')
};

/* O BBCode vive só aqui: nunca é escrito em nenhum elemento da página. */
const estado = {
  titulo: '',
  bbcode: '',
  painel: 'gerador',
  registros: [],
  registrosCarregados: false,
  carregandoRegistros: false,
  erroRegistros: null,
  ultimaGeracao: null
};

/* Tira o que quebraria o BBCode antes de o nick entrar na cartilha. */
function limparNick(valor) {
  return String(valor || '').trim().replace(/[\[\]<>"']/g, '').slice(0, 40);
}

function urlAvatar(nick) {
  return URL_AVATAR.replace('{NICK}', encodeURIComponent(nick));
}

function criarIcone(nome) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'ic');
  const uso = document.createElementNS(NS, 'use');
  uso.setAttribute('href', '#' + nome);
  svg.appendChild(uso);
  return svg;
}

function trocarIcone(elemento, nome) {
  const uso = elemento.querySelector('use');
  if (uso) uso.setAttribute('href', '#' + nome);
}

/* A classe no container esconde o ícone: <svg> não obedece à propriedade hidden. */
function atualizarAvatar(caixa, nick) {
  let img = caixa.querySelector('img');

  if (!nick) {
    if (img) img.remove();
    caixa.classList.remove('com-avatar');
    return;
  }

  if (!img) {
    img = new Image();
    img.alt = '';
    img.decoding = 'async';
    img.addEventListener('error', function () {
      img.remove();
      caixa.classList.remove('com-avatar');
    });
    caixa.appendChild(img);
  }
  caixa.classList.add('com-avatar');
  img.src = urlAvatar(nick);
}

let tempoToast = null;
function avisar(texto, erro) {
  el.toastTexto.textContent = texto;
  el.toast.classList.toggle('erro', erro === true);
  trocarIcone(el.toast, erro ? 'ic-alerta' : 'ic-check');
  el.toast.classList.add('mostrar');

  clearTimeout(tempoToast);
  tempoToast = setTimeout(function () { el.toast.classList.remove('mostrar'); }, TEMPO_TOAST);
}

function feedbackBotao(botao, texto) {
  if (botao.dataset.ocupado === '1') return;

  const rotulo = botao.querySelector('span');
  const original = rotulo ? rotulo.textContent : null;

  botao.dataset.ocupado = '1';
  botao.classList.add('copiado');
  if (rotulo) rotulo.textContent = texto;
  trocarIcone(botao, 'ic-check');

  setTimeout(function () {
    if (rotulo) rotulo.textContent = original;
    trocarIcone(botao, 'ic-copiar');
    botao.classList.remove('copiado');
    botao.dataset.ocupado = '0';
  }, TEMPO_FEEDBACK);
}

/* Clipboard moderno; sem ele, um campo temporário fora da tela. */
async function copiar(texto) {
  if (!texto) return false;

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch (erro) { /* cai para a alternativa */ }
  }

  const area = document.createElement('textarea');
  area.value = texto;
  area.setAttribute('readonly', '');
  area.setAttribute('aria-hidden', 'true');
  area.style.cssText = 'position:fixed;top:-2000px;left:-2000px;opacity:0;pointer-events:none';
  document.body.appendChild(area);
  area.select();
  area.setSelectionRange(0, area.value.length);

  let certo = false;
  try { certo = document.execCommand('copy'); } catch (erro) { certo = false; }
  area.remove();
  return certo;
}

async function copiarComFeedback(texto, botao, rotulo, mensagem) {
  if (await copiar(texto)) {
    feedbackBotao(botao, rotulo);
    avisar(mensagem);
  } else {
    avisar('Não foi possível copiar. Gere a cartilha novamente e tente outra vez.', true);
  }
}

/* Histórico compartilhado: lê e grava no banco remoto (Netlify Blobs, por trás de
   /api/expulsoes). Não existe exclusão remota — ver netlify/functions/expulsoes.mjs. */
const Historico = {
  async listar() {
    const resposta = await fetch(URL_API, { headers: { Accept: 'application/json' } });
    if (!resposta.ok) throw new Error('HTTP ' + resposta.status);
    const corpo = await resposta.json();
    return Array.isArray(corpo.registros) ? corpo.registros : [];
  },

  async registrar(dados) {
    const resposta = await fetch(URL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        responsavel: dados.responsavel,
        expulso: dados.expulso,
        motivo: dados.motivo.label,
        motivoCurto: dados.motivo.labelCurto,
        motivoId: dados.motivo.id,
        bbcode: estado.bbcode
      })
    });

    let corpo = null;
    try { corpo = await resposta.json(); } catch (erro) { /* resposta sem corpo legível */ }

    if (!resposta.ok) {
      const mensagem = (corpo && corpo.erro) || 'Não foi possível registrar a expulsão agora.';
      throw new Error(mensagem);
    }
    return corpo && corpo.registro;
  }
};

/* Seletor de motivo: combobox acessível, sem <select> nativo. */
const Seletor = {
  opcoes: [],
  aberto: false,
  indiceAtivo: -1,
  indiceSelecionado: -1,
  busca: '',
  tempoBusca: null,

  montar(motivos) {
    const self = this;
    const fragmento = document.createDocumentFragment();
    this.opcoes = [];

    motivos.forEach(function (motivo, indice) {
      const item = document.createElement('li');
      item.className = 'selecao-opcao';
      item.id = 'motivo-opcao-' + indice;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', 'false');

      const rotulo = document.createElement('span');
      rotulo.textContent = motivo.label;
      item.appendChild(rotulo);

      item.appendChild(criarIcone('ic-check'));

      fragmento.appendChild(item);
      self.opcoes.push({ id: motivo.id, label: motivo.label, elemento: item });
    });

    el.listaMotivos.appendChild(fragmento);

    el.listaMotivos.addEventListener('click', function (evento) {
      const item = evento.target.closest('.selecao-opcao');
      if (item) self.selecionar(self.opcoes.findIndex(function (o) { return o.elemento === item; }));
    });
    el.listaMotivos.addEventListener('mousemove', function (evento) {
      const item = evento.target.closest('.selecao-opcao');
      if (item) self.ativar(self.opcoes.findIndex(function (o) { return o.elemento === item; }), false);
    });
  },

  valor() {
    return this.indiceSelecionado >= 0 ? this.opcoes[this.indiceSelecionado].id : '';
  },

  abrir(indiceInicial) {
    if (this.aberto || !this.opcoes.length) return;
    this.aberto = true;
    el.selecao.classList.add('aberta');
    el.gatilho.setAttribute('aria-expanded', 'true');
    this.ativar(typeof indiceInicial === 'number' ? indiceInicial : Math.max(this.indiceSelecionado, 0), true);
  },

  fechar(devolverFoco) {
    if (!this.aberto) return;
    this.aberto = false;
    el.selecao.classList.remove('aberta');
    el.gatilho.setAttribute('aria-expanded', 'false');
    el.gatilho.removeAttribute('aria-activedescendant');
    if (this.indiceAtivo >= 0) this.opcoes[this.indiceAtivo].elemento.classList.remove('ativa');
    this.indiceAtivo = -1;
    if (devolverFoco) el.gatilho.focus();
  },

  ativar(indice, rolar) {
    if (indice < 0 || indice >= this.opcoes.length) return;
    if (this.indiceAtivo >= 0) this.opcoes[this.indiceAtivo].elemento.classList.remove('ativa');

    this.indiceAtivo = indice;
    const opcao = this.opcoes[indice];
    opcao.elemento.classList.add('ativa');
    el.gatilho.setAttribute('aria-activedescendant', opcao.elemento.id);
    if (rolar) opcao.elemento.scrollIntoView({ block: 'nearest' });
  },

  mover(passo) {
    const total = this.opcoes.length;
    if (total) this.ativar((this.indiceAtivo + passo + total) % total, true);
  },

  selecionar(indice) {
    if (indice < 0 || indice >= this.opcoes.length) return;

    if (this.indiceSelecionado >= 0) {
      this.opcoes[this.indiceSelecionado].elemento.setAttribute('aria-selected', 'false');
    }
    this.indiceSelecionado = indice;
    this.opcoes[indice].elemento.setAttribute('aria-selected', 'true');

    el.valorMotivo.textContent = this.opcoes[indice].label;
    el.valorMotivo.classList.remove('vazio');
    el.selecao.classList.remove('invalida');

    this.fechar(true);
    mostrarFichaMotivo();
  },

  porTexto(letra) {
    const self = this;
    clearTimeout(this.tempoBusca);
    this.busca += letra.toLowerCase();
    this.tempoBusca = setTimeout(function () { self.busca = ''; }, 700);

    const alvo = this.opcoes.findIndex(function (opcao) {
      return opcao.label.toLowerCase().startsWith(self.busca);
    });
    if (alvo === -1) return;
    if (this.aberto) this.ativar(alvo, true); else this.selecionar(alvo);
  },

  ligar() {
    const self = this;

    el.gatilho.addEventListener('click', function () {
      if (self.aberto) self.fechar(true); else self.abrir();
    });

    el.gatilho.addEventListener('keydown', function (evento) {
      const tecla = evento.key;

      if (tecla === 'ArrowDown' || tecla === 'ArrowUp') {
        evento.preventDefault();
        if (self.aberto) self.mover(tecla === 'ArrowDown' ? 1 : -1);
        else self.abrir(tecla === 'ArrowUp' ? self.opcoes.length - 1 : 0);
        return;
      }
      if (self.aberto && (tecla === 'Home' || tecla === 'End')) {
        evento.preventDefault();
        self.ativar(tecla === 'Home' ? 0 : self.opcoes.length - 1, true);
        return;
      }
      if (tecla === 'Enter' || tecla === ' ') {
        evento.preventDefault();
        if (self.aberto && self.indiceAtivo >= 0) self.selecionar(self.indiceAtivo);
        else if (self.aberto) self.fechar(true);
        else self.abrir();
        return;
      }
      if (tecla === 'Escape' && self.aberto) {
        evento.preventDefault();
        self.fechar(true);
        return;
      }
      if (tecla === 'Tab') {
        self.fechar(false);
        return;
      }
      if (tecla.length === 1 && /\S/.test(tecla)) self.porTexto(tecla);
    });

    document.addEventListener('click', function (evento) {
      if (self.aberto && !el.selecao.contains(evento.target)) self.fechar(false);
    });
  }
};

function trocarPainel(nome) {
  estado.painel = nome;
  document.querySelectorAll('.aba').forEach(function (aba) {
    aba.classList.toggle('ativa', aba.dataset.painel === nome);
  });
  el.painelGerador.hidden = nome !== 'gerador';
  el.painelRegistros.hidden = nome !== 'registros';

  if (nome === 'registros') buscarRegistros();
  else Seletor.fechar(false);
}

function mostrarFichaMotivo() {
  const motivo = TEMPLATES[Seletor.valor()];
  if (!motivo) {
    el.fichaMotivo.hidden = true;
    return;
  }
  el.fichaResumo.textContent = motivo.resumo;
  el.fichaBase.textContent = motivo.fundamentacao;
  el.fichaMotivo.hidden = false;
}

function mostrarErro(caixa, alvo, mensagem) {
  caixa.textContent = mensagem;
  caixa.classList.add('visivel');
  alvo.classList.add('invalida');
  setTimeout(function () { alvo.classList.remove('invalida'); }, 400);
}

function limparErros() {
  [el.erroResp, el.erroExp, el.erroMotivo].forEach(function (caixa) {
    caixa.textContent = '';
    caixa.classList.remove('visivel');
  });
}

function validarFormulario() {
  limparErros();

  const responsavel = limparNick(el.responsavel.value);
  const expulso = limparNick(el.expulso.value);
  const motivo = TEMPLATES[Seletor.valor()];
  let certo = true;

  if (!responsavel) {
    mostrarErro(el.erroResp, el.responsavel.closest('.entrada'), 'Informe o nick do responsável.');
    certo = false;
  }
  if (!expulso) {
    mostrarErro(el.erroExp, el.expulso.closest('.entrada'), 'Informe o nick do militar expulso.');
    certo = false;
  }
  if (!motivo) {
    mostrarErro(el.erroMotivo, el.selecao, 'Selecione o motivo da expulsão.');
    certo = false;
  }
  if (certo && responsavel.toLowerCase() === expulso.toLowerCase()) {
    mostrarErro(el.erroExp, el.expulso.closest('.entrada'), 'O responsável e o militar expulso não podem ser o mesmo nick.');
    certo = false;
  }

  if (!certo) {
    avisar('Preencha os campos obrigatórios para gerar a cartilha.', true);
    return null;
  }

  const agora = new Date();
  return {
    responsavel: responsavel,
    expulso: expulso,
    motivo: motivo,
    data: agora.toLocaleDateString('pt-BR'),
    hora: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  };
}

async function gerarCartilha(evento) {
  if (evento) evento.preventDefault();
  if (el.botaoGerar.disabled) return;

  const dados = validarFormulario();
  if (!dados) return;

  const valores = {
    expulso: dados.expulso,
    responsavel: dados.responsavel,
    motivoLabel: dados.motivo.label,
    data: dados.data,
    hora: dados.hora
  };
  estado.titulo = aplicarPlaceholders(dados.motivo.titulo, valores);
  estado.bbcode = aplicarPlaceholders(dados.motivo.bbcode, valores);
  estado.ultimaGeracao = dados;

  el.saidaTitulo.value = estado.titulo;
  el.resultado.hidden = false;
  el.rodapeResultado.textContent = 'Cartilha pronta para ' + dados.expulso + '. Registrando no histórico compartilhado...';
  avisar('Cartilha gerada. Use os botões para copiar.');
  el.resultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  await registrarComFeedback(dados);
}

async function registrarComFeedback(dados) {
  el.botaoGerar.disabled = true;
  try {
    await Historico.registrar(dados);
    el.rodapeResultado.textContent = 'Cartilha pronta para ' + dados.expulso + ' — expulsão registrada em '
      + dados.data + ' às ' + dados.hora + '.';
    if (estado.painel === 'registros') buscarRegistros();
  } catch (erro) {
    montarRodapeComFalha(dados, erro.message);
  } finally {
    el.botaoGerar.disabled = false;
  }
}

function montarRodapeComFalha(dados, mensagem) {
  el.rodapeResultado.textContent = '';

  const aviso = document.createElement('span');
  aviso.textContent = 'Cartilha pronta para ' + dados.expulso + ', mas não foi possível registrar no histórico compartilhado (' + mensagem + '). ';

  const tentar = document.createElement('button');
  tentar.type = 'button';
  tentar.textContent = 'Tentar registrar novamente';
  tentar.className = 'link-tentar-novamente';
  tentar.addEventListener('click', function () { registrarComFeedback(dados); });

  el.rodapeResultado.appendChild(aviso);
  el.rodapeResultado.appendChild(tentar);
  avisar('A cartilha foi gerada, mas o registro no histórico falhou.', true);
}

function atualizarContador() {
  el.contador.textContent = estado.registrosCarregados ? String(estado.registros.length) : '—';
}

function formatarDataHora(criadoEm) {
  const data = new Date(criadoEm);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleDateString('pt-BR') + ' às ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function montarRegistro(item) {
  const no = el.modeloRegistro.content.firstElementChild.cloneNode(true);
  no.dataset.id = item.id;
  const nicks = no.querySelectorAll('.pessoa-nick');
  const imagens = no.querySelectorAll('.pessoa-avatar img');

  nicks[0].textContent = item.responsavel;
  nicks[1].textContent = item.expulso;
  imagens.forEach(function (img, indice) {
    img.addEventListener('error', function () { img.remove(); });
    img.src = urlAvatar(indice === 0 ? item.responsavel : item.expulso);
  });
  no.querySelector('.etiqueta').textContent = item.motivoCurto || item.motivo || 'Motivo não informado';
  no.querySelector('.registro-data').textContent = formatarDataHora(item.criadoEm);

  const botaoCopiar = no.querySelector('.registro-copiar');
  botaoCopiar.disabled = !item.bbcode;
  botaoCopiar.addEventListener('click', function () {
    copiarComFeedback(item.bbcode, botaoCopiar, null, 'BBCode copiado novamente!');
  });

  return no;
}

function renderizarStatusRegistros() {
  el.statusRegistros.classList.remove('erro');

  if (estado.carregandoRegistros && !estado.registrosCarregados) {
    el.statusRegistros.hidden = false;
    el.statusRegistros.textContent = 'Carregando histórico...';
    return;
  }

  if (estado.erroRegistros) {
    el.statusRegistros.hidden = false;
    el.statusRegistros.classList.add('erro');
    el.statusRegistros.textContent = '';

    const texto = document.createElement('span');
    texto.textContent = 'Não foi possível carregar o histórico (' + estado.erroRegistros + ').';
    const tentar = document.createElement('button');
    tentar.type = 'button';
    tentar.textContent = 'Tentar novamente';
    tentar.addEventListener('click', function () { buscarRegistros(); });

    el.statusRegistros.appendChild(texto);
    el.statusRegistros.appendChild(tentar);
    return;
  }

  el.statusRegistros.hidden = true;
}

function renderizarRegistros() {
  if (estado.painel !== 'registros') return;

  renderizarStatusRegistros();

  const termo = el.campoBusca.value.trim().toLowerCase();
  let lista = estado.registros.slice().sort(function (a, b) {
    return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime();
  });
  if (termo) {
    lista = lista.filter(function (item) {
      return (item.expulso + ' ' + item.responsavel + ' ' + (item.motivo || '')).toLowerCase().includes(termo);
    });
  }

  const fragmento = document.createDocumentFragment();
  if (!lista.length) {
    const vazio = document.createElement('p');
    vazio.className = 'lista-vazia';
    if (!estado.registrosCarregados) {
      vazio.textContent = '';
    } else {
      vazio.textContent = termo
        ? 'Nenhum registro encontrado para esta busca.'
        : 'Nenhuma expulsão registrada até o momento.';
    }
    fragmento.appendChild(vazio);
  } else {
    lista.forEach(function (item) { fragmento.appendChild(montarRegistro(item)); });
  }

  el.listaRegistros.replaceChildren(fragmento);
}

async function buscarRegistros() {
  if (estado.carregandoRegistros) return;

  estado.carregandoRegistros = true;
  estado.erroRegistros = null;
  el.btnAtualizar.classList.add('carregando');
  renderizarRegistros();

  try {
    estado.registros = await Historico.listar();
    estado.registrosCarregados = true;
  } catch (erro) {
    estado.erroRegistros = erro.message || 'falha de rede';
  } finally {
    estado.carregandoRegistros = false;
    el.btnAtualizar.classList.remove('carregando');
    atualizarContador();
    renderizarRegistros();
  }
}

function comAtraso(funcao, espera) {
  let tempo = null;
  return function () {
    clearTimeout(tempo);
    tempo = setTimeout(funcao, espera);
  };
}

function ligarEventos() {
  el.formulario.addEventListener('submit', gerarCartilha);

  const avatarResp = comAtraso(function () { atualizarAvatar(el.avatarResp, limparNick(el.responsavel.value)); }, 550);
  const avatarExp = comAtraso(function () { atualizarAvatar(el.avatarExp, limparNick(el.expulso.value)); }, 550);
  el.responsavel.addEventListener('input', avatarResp);
  el.expulso.addEventListener('input', avatarExp);

  el.btnCopiarTitulo.addEventListener('click', function () {
    copiarComFeedback(estado.titulo, el.btnCopiarTitulo, 'TÍTULO COPIADO', 'Título copiado com sucesso!');
  });
  el.btnCopiarBBCode.addEventListener('click', function () {
    copiarComFeedback(estado.bbcode, el.btnCopiarBBCode, 'BBCODE COPIADO', 'BBCode copiado com sucesso!');
  });

  document.querySelectorAll('.aba').forEach(function (aba) {
    aba.addEventListener('click', function () { trocarPainel(aba.dataset.painel); });
  });

  el.campoBusca.addEventListener('input', comAtraso(renderizarRegistros, 120));
  el.btnAtualizar.addEventListener('click', function () { buscarRegistros(); });

  document.addEventListener('keydown', function (evento) {
    if ((evento.ctrlKey || evento.metaKey) && evento.key === 'Enter') gerarCartilha(evento);
  });
}

/* Sem midia-imagens/emblema-cs.png o topo fica limpo, sem imagem quebrada. */
function prepararEmblema() {
  const esconder = function () { document.body.classList.add('sem-emblema'); };
  el.emblema.addEventListener('error', esconder);
  if (el.emblema.complete && el.emblema.naturalWidth === 0) esconder();
}

(function iniciar() {
  prepararEmblema();
  Seletor.montar(listarMotivos());
  Seletor.ligar();
  ligarEventos();
  atualizarContador();
  buscarRegistros(); /* carrega o histórico já na abertura, para o contador da aba não ficar em "—" */
})();
