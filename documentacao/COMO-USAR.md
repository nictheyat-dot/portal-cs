# Como usar o gerador

## Passo a passo

1. Abra o site (ou o arquivo `index.html`, se estiver usando local).
2. Na aba **GERADOR**, preencha:
   - **Nick do responsável** — quem está aplicando a expulsão;
   - **Nick do militar expulso** — quem está sendo desligado.
3. Escolha o **motivo da expulsão**. Aparece uma ficha com o resumo e a base regimental.
4. Clique em **GERAR CARTILHA** (ou pressione `Ctrl + Enter`).
5. Copie e cole na mensagem privada do system, usando os dois botões que aparecem:
   - **COPIAR TÍTULO** → vai no assunto;
   - **COPIAR BBCODE** → vai no corpo.

O BBCode não aparece na tela de propósito: ele é montado por dentro e vai direto para a
área de transferência quando você clica no botão. Os dois botões avisam quando a cópia deu
certo (**TÍTULO COPIADO** / **BBCODE COPIADO**).

## Motivos disponíveis

| Motivo | Base |
|---|---|
| Meta semanal não cumprida | 02 semanas consecutivas em aberto |
| Inatividade por 07 dias | Artigo 57, § 4º do Regimento Interno |
| Capacitação não realizada no prazo | Artigo 19 do Regimento Interno |

## Aba REGISTROS

Guarda o histórico **compartilhado** das expulsões: quem expulsou, quem foi expulso, o
motivo e a data/hora. É o mesmo histórico para todos os supervisores, em qualquer
computador ou celular — não depende de quem criou o registro nem de qual navegador foi
usado.

- **Buscar:** digite um nick ou o nome do motivo no campo de busca.
- **Atualizar:** clique no botão ao lado da busca para buscar os registros mais recentes
  (a lista também é buscada sozinha ao abrir a aba e logo depois de gerar uma cartilha).
- **Copiar de novo:** cada registro tem um botão de copiar — reenvia o mesmo BBCode para
  a área de transferência, sem precisar preencher o formulário de novo.
- Não existe exclusão pelo site: um registro fica no histórico permanentemente (ver
  [SEGURANCA-E-LIMITES.md](SEGURANCA-E-LIMITES.md) para o motivo).

> Se a rede ou o histórico remoto falhar, aparece um aviso com um botão de **tentar
> novamente** — a página nunca finge que carregou ou salvou algo que não conseguiu.

## Teclado

| Atalho | Ação |
|---|---|
| `Ctrl + Enter` | Gerar cartilha |
| `Enter` / `Espaço` / `↓` / `↑` | Abrir a lista de motivos |
| `↓` / `↑` | Navegar entre os motivos |
| `Home` / `End` | Primeiro / último motivo |
| `Esc` | Fechar a lista |
| Letras | Pular para o motivo que começa com elas |

## Se algo não funcionar

- **A cópia não vai:** o navegador só libera a área de transferência em site publicado
  (https) ou em `localhost`. Abrindo o arquivo direto do disco, alguns navegadores
  bloqueiam — nesse caso o aviso vermelho aparece na tela.
- **A tela ficou com o visual antigo:** dê `Ctrl + F5` para o navegador buscar os arquivos
  novos.
- **O avatar não carrega:** é só enfeite; sem internet o campo mostra um ícone neutro e o
  gerador continua funcionando.
