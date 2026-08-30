/*
  Modelos oficiais das cartilhas de expulsão do Centro de Supervisão.

  O BBCode de cada motivo é montado em três partes:
    CABECALHO (banner + saudação) + corpo (texto específico do motivo) + RODAPE
    (botões de contato da Liderança + créditos).
  CABECALHO e RODAPE são idênticos nos três motivos e ficam centralizados aqui: uma
  alteração nos botões de WhatsApp ou nos créditos passa a valer para todas as
  cartilhas de uma vez, sem precisar editar cada bloco.

  Para editar o texto de um motivo, mexa apenas no campo "corpo" (entre crases). Para
  um motivo novo, copie um bloco inteiro, troque id/label/titulo/corpo e acrescente o
  id em ORDEM_MOTIVOS — o seletor se monta sozinho.
  Dentro do BBCode não use crase nem ${ : quebram a string do JavaScript.

  Placeholders: {USERNAME} (expulso), {RESPONSAVEL}, {MOTIVO}, {DATA}, {HORA}.
*/

const CABECALHO = `
[font=Poppins][table style="width:100%;border:none!important;overflow:hidden;border-radius:15px;border-collapse:collapse;border-spacing:0" bgcolor="#3e8025"][tr style="border:none!important"][td style="border:none!important;overflow:hidden;padding:0;font-family:Poppins,Arial,sans-serif"][img]https://i.imgur.com/2KiC335.png[/img][/td][/tr][tr style="border:none!important"][td style="border:none!important;overflow:hidden;padding:12px 8px 7px;font-family:Poppins,Arial,sans-serif" bgcolor="#2e581d"][center][table style="width:auto;border:none!important;border-spacing:0;position:relative;z-index:2;margin-bottom:-9px"][tr style="border:none!important"][td style="border:none!important;background:#339900;color:#ffffff;border-radius:999px;padding:5px 17px;font-weight:700;font-size:10px;text-transform:uppercase;white-space:nowrap;box-shadow:0 2px 5px rgba(0,0,0,0.25)"]NOTIFICAÇÃO DE EXPULSÃO[/td][/tr][/table][/center][table style="width:100%;border:none!important;overflow:hidden;line-height:1.55em;border-radius:13px;border-collapse:collapse;border-spacing:0" bgcolor="#ffffff"][tr style="border:none!important"][td style="border:none!important;overflow:hidden;padding:19px 19px 16px;font-family:Poppins,Arial,sans-serif" bgcolor="#ffffff"][center]Saudações, [color=#00c203][b]{USERNAME}[/b][/color]![/center]

[left]`;

const RODAPE = `[/left][/td][/tr][/table][center][table style="width:56%;border:none!important;border-spacing:0;margin:8px auto 3px;text-decoration:none!important"][tr style="border:none!important;text-decoration:none!important"][td style="width:50%;border:none!important;padding:2px 3px;text-decoration:none!important"][url=https://wa.me/5553991117152?text=Ol%C3%A1%2C%20Energyy.%20Gostaria%20de%20conversar%20sobre%20uma%20poss%C3%ADvel%20readmiss%C3%A3o%20no%20Centro%20de%20Supervis%C3%A3o.][table style="width:100%;border:1px solid #1fbf5b;border-radius:8px;overflow:hidden;border-spacing:0;border-collapse:separate;background:#ffffff;text-decoration:none!important"][tr style="border:none!important;text-decoration:none!important"][td align="center" style="border:none!important;width:34px;padding:3px;background:#128c3e;text-decoration:none!important"][img(24px,24px)]https://api.iconify.design/tabler/brand-whatsapp.svg?color=white[/img][/td][td style="border:none!important;padding:4px 6px;color:#146b32;text-align:left;background:#ffffff;line-height:1.15;text-decoration:none!important;text-decoration-line:none!important"][size=9][b]ENERGYY[/b][/size]
[size=8]Líder[/size][/td][/tr][/table][/url][/td][td style="width:50%;border:none!important;padding:2px 3px;text-decoration:none!important"][url=https://wa.me/5531987017387?text=Ol%C3%A1%2C%20unloav.%20Gostaria%20de%20conversar%20sobre%20uma%20poss%C3%ADvel%20readmiss%C3%A3o%20no%20Centro%20de%20Supervis%C3%A3o.][table style="width:100%;border:1px solid #1fbf5b;border-radius:8px;overflow:hidden;border-spacing:0;border-collapse:separate;background:#ffffff;text-decoration:none!important"][tr style="border:none!important;text-decoration:none!important"][td align="center" style="border:none!important;width:34px;padding:3px;background:#128c3e;text-decoration:none!important"][img(24px,24px)]https://api.iconify.design/tabler/brand-whatsapp.svg?color=white[/img][/td][td style="border:none!important;padding:4px 6px;color:#146b32;text-align:left;background:#ffffff;line-height:1.15;text-decoration:none!important;text-decoration-line:none!important"][size=9][b]UNLOAV[/b][/size]
[size=8]Vice-Líder[/size][/td][/tr][/table][/url][/td][/tr][/table][/center][center][size=8][color=#d7ead7]Se deseja retornar, procure a Liderança. Recomeçar também é uma oportunidade de demonstrar evolução.[/color][/size][/center][center][size=9][color=#ffffff]Desenvolvido por [b]unloav e Energyy[/b] - ® Direitos reservados ao Centro de Supervisão[/color][/size][/center][/td][/tr][/table][/font]
`;

const TEMPLATES = {

  /* 1) META SEMANAL */
  metaSemanal: {
    id: 'metaSemanal',
    label: 'Meta semanal não cumprida',
    labelCurto: 'Meta Semanal',
    titulo: '[CS] Notificação de Expulsão — Meta Semanal',
    resumo: 'Desligamento por não cumprimento da meta semanal por 02 (duas) semanas consecutivas.',
    fundamentacao: 'Meta semanal — 02 semanas consecutivas em aberto',
    corpo: `Infelizmente, sua permanência no [b][color=#00c203]Centro de Supervisão[/color][/b] foi encerrada após o não cumprimento da meta semanal por [b]02 (duas) semanas consecutivas[/b].

Esse encerramento não precisa representar o fim da sua trajetória no CS. Se ainda houver interesse em retornar, você poderá solicitar uma [b][color=#00c203]readmissão[/color][/b], iniciando uma nova etapa com a oportunidade de demonstrar novamente seu comprometimento.

Para receber as orientações necessárias — ou caso considere que houve algum equívoco na decisão — entre em contato diretamente com a [b][color=#00c203]Liderança do Centro de Supervisão[/color][/b] por um dos botões abaixo.`
  },

  /* 2) INATIVIDADE POR 7 DIAS */
  inatividade7Dias: {
    id: 'inatividade7Dias',
    label: 'Inatividade por 07 dias',
    labelCurto: 'Inatividade',
    titulo: '[CS] Notificação de Expulsão — Inatividade',
    resumo: 'Desligamento por ausência do Habbo Hotel durante 07 (sete) dias.',
    fundamentacao: 'Artigo 57, § 4º — Regimento Interno do Centro de Supervisão',
    corpo: `Sua permanência no [b][color=#00c203]Centro de Supervisão[/color][/b] foi encerrada em razão de sua ausência do [i]Habbo Hotel[/i] por [b]07 (sete) dias[/b], situação prevista no [b]Artigo 57, § 4º[/b], do Regimento Interno do Centro de Supervisão.

A participação no Centro exige presença e acompanhamento contínuo das atividades. Ainda assim, esse desligamento não precisa ser entendido como o encerramento definitivo da sua trajetória conosco. Caso tenha interesse em retornar, a [b][color=#00c203]readmissão[/color][/b] poderá representar uma nova oportunidade para reorganizar sua rotina e retomar suas responsabilidades com maior constância.

Se desejar receber orientações sobre uma possível readmissão — ou caso considere que exista alguma informação relevante sobre o período de ausência que deva ser analisada — entre em contato diretamente com a [b][color=#00c203]Liderança do Centro de Supervisão[/color][/b] por um dos botões abaixo.`
  },

  /* 3) CAPACITAÇÃO NÃO REALIZADA NO PRAZO */
  capacitacaoPrazo: {
    id: 'capacitacaoPrazo',
    label: 'Capacitação não realizada no prazo',
    labelCurto: 'Capacitação',
    titulo: '[CS] Notificação de Expulsão — Capacitação',
    resumo: 'Desligamento por não realização da Capacitação nos 07 (sete) dias iniciais.',
    fundamentacao: 'Artigo 19 — Regimento Interno do Centro de Supervisão',
    corpo: `Sua permanência no [b][color=#00c203]Centro de Supervisão[/color][/b] foi encerrada em razão da não realização da [b]Capacitação[/b] dentro do prazo estabelecido de [b]07 (sete) dias iniciais[/b], conforme previsto no [b]Artigo 19 do Regimento Interno do Centro de Supervisão[/b]. Esse período é destinado à preparação necessária para que o integrante esteja apto a exercer corretamente as responsabilidades atribuídas dentro do Centro.

A capacitação faz parte do processo de desenvolvimento de cada membro e é essencial para garantir que todos compreendam os procedimentos e padrões do CS. O não cumprimento desse prazo resulta no encerramento da permanência, mas isso não impede que, futuramente, você possa buscar uma [b][color=#00c203]readmissão[/color][/b] e iniciar uma nova etapa com maior disponibilidade para concluir o processo.

Caso ainda tenha interesse em fazer parte do Centro de Supervisão, entre em contato com a [b][color=#00c203]Liderança[/color][/b] para receber as orientações sobre uma possível readmissão. Se considerar que houve alguma circunstância específica que impediu a conclusão da capacitação dentro do prazo, a situação também poderá ser apresentada para análise.`
  }

};

/* Monta o BBCode final de cada motivo uma única vez, no carregamento do script. */
Object.keys(TEMPLATES).forEach(function (id) {
  const motivo = TEMPLATES[id];
  motivo.bbcode = CABECALHO + motivo.corpo + RODAPE;
});

/* Ordem dos motivos no seletor. */
const ORDEM_MOTIVOS = ['metaSemanal', 'inatividade7Dias', 'capacitacaoPrazo'];

function listarMotivos() {
  return ORDEM_MOTIVOS.map(function (id) { return TEMPLATES[id]; }).filter(Boolean);
}

function aplicarPlaceholders(texto, dados) {
  return String(texto)
    .replace(/\{USERNAME\}/g, dados.expulso || '')
    .replace(/\{RESPONSAVEL\}/g, dados.responsavel || '')
    .replace(/\{MOTIVO\}/g, dados.motivoLabel || '')
    .replace(/\{DATA\}/g, dados.data || '')
    .replace(/\{HORA\}/g, dados.hora || '')
    .replace(/\{OBSERVACAO\}/g, dados.observacao || '')
    .trim();
}
