<?php
declare(strict_types=1);

/**
 * Processador do formulário de contato.
 *
 * ⚠️ ISTO SÓ FUNCIONA NA HOSTGATOR. É PHP: a Vercel não executa PHP, então na
 * preview qualquer envio falha. Não é defeito do site. Para testar o formulário
 * sem depender da Hostgator, use `ferramentas/validar-formulario.mjs`, que finge
 * ser o servidor e mostra o que o visitante veria em cada caso.
 *
 * Conferido em 02/09/2026, tarefa 2.7, contra a produção:
 *   - o arquivo existe e o PHP é executado (o código-fonte não vaza);
 *   - a armadilha anti-robô descarta em silêncio, como deve;
 *   - a validação recusa e-mail inválido e campos vazios (HTTP 422);
 *   - o SPF do domínio autoriza a Hostgator a enviar, e o MX aponta para o
 *     próprio servidor: a entrega é local, sem sair para a internet.
 *
 * ⚠️ O QUE AINDA NÃO FOI PROVADO: que a mensagem CHEGA. A linha do mail(), lá
 * embaixo, é a única que nenhum teste exercitou — exercitá-la significa mandar
 * um e-mail de verdade para a caixa da Clorofilla.
 */

// Endereço CONFIRMADO pelo Pedro em 01/09/2026. Não "corrigir".
$toEmail   = 'contato@clorofillaambiental.com.br';

// Remetente. Precisa ser aceito pelo servidor da HostGator.
// ⚠️ A VERIFICAR quando houver acesso ao painel: se a conta no-reply@ não
// existir no cPanel, alguns servidores recusam a mensagem ou a marcam como
// spam. É o candidato número um caso o envio falhe.
$fromEmail = 'no-reply@clorofillaambiental.com.br';

$isAjax = (
    isset($_SERVER['HTTP_X_REQUESTED_WITH']) &&
    strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest'
) || isset($_POST['ajax']);

function respond(bool $success, string $message, int $statusCode = 200, bool $isAjax = false): void
{
    http_response_code($statusCode);

    if ($isAjax) {
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            'success' => $success,
            'message' => $message,
        ]);
    } else {
        ?>
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Clorofilla - Contato</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 3rem; color: #222; }
                .status { max-width: 560px; margin: auto; }
                a { color: #99b381; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="status">
                <h1><?php echo $success ? 'Mensagem enviada!' : 'Ops, aconteceu algo'; ?></h1>
                <p><?php echo htmlspecialchars($message, ENT_QUOTES, 'UTF-8'); ?></p>
                <p><a href="/">Voltar ao site</a></p>
            </div>
        </body>
        </html>
        <?php
    }
    exit;
}

// ---------------------------------------------------------------------------
// TRAVAS CONTRA ROBÔS (22/11/2026)
//
// De 16/09 a 21/11 chegaram 31 mensagens falsas, todas com o mesmo texto, e o
// campo escondido `company` não pegou nenhuma. Duas travas novas:
//
//  1. A FICHA. A página pede ao servidor uma ficha assinada (GET ?ficha=1)
//     quando o visitante começa a mexer no formulário, e a devolve no envio.
//     Robô que manda direto para este arquivo, sem abrir a página, chega sem
//     ficha, ou com uma inventada, e é recusado.
//  2. A ESPERA. A ficha leva o instante em que foi emitida. Envio feito menos
//     de FICHA_ESPERA_MINIMA segundos depois é recusado: nenhuma pessoa
//     preenche o formulário tão rápido. A página espera sozinha se precisar,
//     então o visitante nunca vê essa recusa.
//
// A assinatura usa um segredo que NÃO está no repositório (que é público):
// ele é criado no primeiro uso, num arquivo FORA da pasta pública do site.
// As recusas são anotadas em outro arquivo, também fora da pasta pública, para
// sabermos se as travas estão pegando os robôs.
// ---------------------------------------------------------------------------
const FICHA_ESPERA_MINIMA = 3;      // segundos
const FICHA_VALIDADE      = 86400;  // 24 horas

function pastaPrivada(): string
{
    // Um nível acima da pasta do site: na Hostgator, /home1/teresa46.
    return dirname(__DIR__);
}

function segredoDoFormulario(): string
{
    static $segredo = null;
    if ($segredo !== null) return $segredo;

    $arquivo = pastaPrivada() . '/clorofilla-formulario-segredo.txt';
    $lido = @file_get_contents($arquivo);
    if (is_string($lido) && strlen(trim($lido)) >= 32) return $segredo = trim($lido);

    // Primeiro uso: cria. O modo 'x' falha se outro pedido criou no mesmo
    // instante; nesse caso, vale o que ele gravou.
    $novo = bin2hex(random_bytes(32));
    $h = @fopen($arquivo, 'x');
    if ($h !== false) {
        fwrite($h, $novo);
        fclose($h);
        @chmod($arquivo, 0600);
        return $segredo = $novo;
    }
    $lido = @file_get_contents($arquivo);
    if (is_string($lido) && strlen(trim($lido)) >= 32) return $segredo = trim($lido);

    // Sem permissão de escrita fora do site: segredo tirado do próprio servidor.
    return $segredo = hash('sha256', __FILE__ . php_uname() . 'clorofilla-formulario');
}

function registrarBarrado(string $motivo): void
{
    $arquivo = pastaPrivada() . '/clorofilla-formulario-barrados.log';
    $tamanho = @filesize($arquivo);
    if ($tamanho !== false && $tamanho > 1048576) return; // teto de 1 MB
    $navegador = substr((string) preg_replace('/\s+/', ' ', $_SERVER['HTTP_USER_AGENT'] ?? '-'), 0, 150);
    @file_put_contents(
        $arquivo,
        date('Y-m-d H:i:s') . "\t" . $motivo . "\t" . $navegador . "\n",
        FILE_APPEND | LOCK_EX
    );
}

// Trava 3, o "não sou um robô" da Cloudflare (Turnstile), conta da Kriya Build.
// A chave secreta mora num arquivo FORA da pasta pública, enviado pela
// ferramenta `enviar-segredo-turnstile.mjs` a partir do .env do projeto. Sem
// esse arquivo, a trava fica desligada (e as outras duas continuam valendo).
function segredoTurnstile(): string
{
    $lido = @file_get_contents(pastaPrivada() . '/clorofilla-turnstile-segredo.txt');
    return is_string($lido) ? trim($lido) : '';
}

/** true = a Cloudflare aprovou; false = recusou; null = não deu para perguntar. */
function conferirTurnstile(string $resposta, string $segredo): ?bool
{
    $url   = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    $dados = http_build_query([
        'secret'   => $segredo,
        'response' => $resposta,
        'remoteip' => $_SERVER['REMOTE_ADDR'] ?? '',
    ]);
    $corpo = false;
    if (function_exists('curl_init')) {
        $c = curl_init($url);
        curl_setopt_array($c, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $dados,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT        => 8,
        ]);
        $corpo = curl_exec($c);
        curl_close($c);
    } else {
        $contexto = stream_context_create(['http' => [
            'method'  => 'POST',
            'header'  => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => $dados,
            'timeout' => 8,
        ]]);
        $corpo = @file_get_contents($url, false, $contexto);
    }
    if (!is_string($corpo) || $corpo === '') return null;
    $j = json_decode($corpo, true);
    if (!is_array($j) || !array_key_exists('success', $j)) return null;
    return $j['success'] === true;
}

// A página pede a ficha.
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['ficha'])) {
    $agora = (string) time();
    header('Content-Type: application/json; charset=UTF-8');
    header('Cache-Control: no-store');
    echo json_encode(['ficha' => $agora . '.' . hash_hmac('sha256', $agora, segredoDoFormulario())]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Método não permitido.', 405, $isAjax);
}

// Honeypot
if (!empty($_POST['company'] ?? '')) {
    registrarBarrado('campo escondido preenchido');
    respond(true, 'Mensagem recebida.', 200, $isAjax);
}

// Trava 1: a ficha precisa existir e ter sido assinada por este servidor.
$ficha  = (string) ($_POST['ficha'] ?? '');
$partes = explode('.', $ficha, 2);
$fichaValida = count($partes) === 2
    && ctype_digit($partes[0])
    && hash_equals(hash_hmac('sha256', $partes[0], segredoDoFormulario()), $partes[1]);

if (!$fichaValida) {
    registrarBarrado($ficha === '' ? 'sem ficha' : 'ficha falsa');
    respond(false, 'Não foi possível confirmar o envio. Recarregue a página e tente de novo.', 400, $isAjax);
}

// Trava 2: rápido demais para uma pessoa, ou ficha velha demais.
$idade = time() - (int) $partes[0];
if ($idade < FICHA_ESPERA_MINIMA) {
    registrarBarrado("rapido demais ({$idade} s)");
    respond(false, 'Envio rápido demais. Aguarde alguns segundos e tente de novo.', 429, $isAjax);
}
if ($idade > FICHA_VALIDADE) {
    registrarBarrado('ficha vencida');
    respond(false, 'A página ficou aberta por muito tempo. Recarregue a página e envie de novo.', 400, $isAjax);
}

// Trava 3: a Cloudflare precisa ter aprovado. Se ela não responder (fora do
// ar, rede), a mensagem passa: as duas travas acima já valeram, e perder o
// contato de um cliente de verdade é pior que deixar passar um robô.
$segredoTs = segredoTurnstile();
if ($segredoTs !== '') {
    $avisoTurnstile = 'Não foi possível confirmar que a mensagem veio de uma pessoa. '
        . 'Se apareceu uma caixa de verificação acima do botão, marque-a e envie de novo; '
        . 'se não, recarregue a página e tente outra vez.';
    $respostaTs = (string) ($_POST['cf-turnstile-response'] ?? '');
    if ($respostaTs === '') {
        registrarBarrado('sem o ok da Cloudflare');
        respond(false, $avisoTurnstile, 400, $isAjax);
    }
    $aprovado = conferirTurnstile($respostaTs, $segredoTs);
    if ($aprovado === false) {
        registrarBarrado('Cloudflare recusou');
        respond(false, $avisoTurnstile, 400, $isAjax);
    }
    if ($aprovado === null) {
        registrarBarrado('Cloudflare nao respondeu: mensagem DEIXADA PASSAR');
    }
}

$firstName = trim($_POST['first_name'] ?? '');
$lastName  = trim($_POST['last_name'] ?? '');
$email     = trim($_POST['email'] ?? '');
$phone     = trim($_POST['phone'] ?? '');
$message   = trim($_POST['message'] ?? '');

if ($firstName === '' || $lastName === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Por favor, preencha os campos obrigatórios corretamente.', 422, $isAjax);
}

$subject = 'Novo contato pelo site - Clorofilla';
$bodyLines = [
    "Nome: {$firstName} {$lastName}",
    "E-mail: {$email}",
    "Telefone: {$phone}",
    "Mensagem:",
    $message,
    '',
    '---',
    'Enviado em: ' . date('d/m/Y H:i:s'),
    'Origem: ' . ($_SERVER['HTTP_REFERER'] ?? 'site'),
];
$body = implode("\r\n", $bodyLines);

$headers = [
    'MIME-Version: 1.0',
    'Content-type: text/plain; charset=UTF-8',
    'From: ' . $fromEmail,
    'Reply-To: ' . $email,
    'X-Mailer: PHP/' . phpversion(),
];

$sent = mail($toEmail, $subject, $body, implode("\r\n", $headers));

if ($sent) {
    respond(true, 'Obrigado! Recebemos sua mensagem.', 200, $isAjax);
}

respond(false, 'Não foi possível enviar o e-mail agora. Tente novamente em alguns instantes.', 500, $isAjax);
