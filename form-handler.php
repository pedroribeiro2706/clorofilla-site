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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Método não permitido.', 405, $isAjax);
}

// Honeypot
if (!empty($_POST['company'] ?? '')) {
    respond(true, 'Mensagem recebida.', 200, $isAjax);
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
