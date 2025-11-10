<?php
declare(strict_types=1);

/**
 * Simple contact form handler.
 * Configure the $toEmail and $fromEmail addresses to match your domain.
 */

$toEmail   = 'contato@clorofillaambiental.com.br'; // TODO: ajuste para o e-mail desejado
$fromEmail = 'no-reply@clorofillaambiental.com.br'; // Precisa ser um remetente autorizado no HostGator

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
