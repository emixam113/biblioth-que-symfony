<?php

namespace App\Service;

use Psr\Log\LoggerInterface;
use Symfony\Component\HttpClient\Exception\TransportExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class WebSocketNotifier
{
    private HttpClientInterface $httpClient;
    private ?LoggerInterface $logger;
    private string $webSocketUrl;

    public function __construct(
        HttpClientInterface $httpClient,
        ?LoggerInterface $logger = null,
        string $webSocketUrl = 'http://localhost:8080/update'
    ) {
        $this->httpClient = $httpClient;
        $this->logger = $logger;
        $this->webSocketUrl = $webSocketUrl;
    }

    public function notify(array $data): void
    {
        try {
            $response = $this->httpClient->request('POST', $this->webSocketUrl, [
                'json' => $data,
                'timeout' => 2, // Timeout en secondes
                'max_duration' => 5, // Durée maximale de la requête
            ]);

            // Vérifier le statut de la réponse
            $statusCode = $response->getStatusCode();
            if ($statusCode >= 200 && $statusCode < 300) {
                $this->log('info', 'WebSocket notification sent successfully', [
                    'status_code' => $statusCode,
                    'data' => $data
                ]);
            } else {
                $this->log('error', 'WebSocket server returned an error', [
                    'status_code' => $statusCode,
                    'response' => $response->getContent(false)
                ]);
            }
        } catch (TransportExceptionInterface $e) {
            $this->log('error', 'Failed to send WebSocket notification', [
                'error' => $e->getMessage(),
                'url' => $this->webSocketUrl,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            $this->log('error', 'Unexpected error while sending WebSocket notification', [
                'error' => $e->getMessage(),
                'url' => $this->webSocketUrl,
                'data' => $data
            ]);
        }
    }

    private function log(string $level, string $message, array $context = []): void
    {
        if ($this->logger) {
            $this->logger->$level($message, $context);
        } else {
            // Fallback vers error_log si le logger n'est pas disponible
            error_log(sprintf('[%s] %s %s', 
                strtoupper($level), 
                $message, 
                json_encode($context, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
            ));
        }
    }
}