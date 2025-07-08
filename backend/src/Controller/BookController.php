<?php

namespace App\Controller;

use App\Entity\Book;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use App\Service\WebSocketNotifier;

/**
 * @Route("/api", name="api_")
 */

#[Route('/api', name: 'api_')]
class BookController extends AbstractController
{
    private $entityManager;
    private $webSocketNotifier;



    public function options()
    {
        $response = new Response();
        $response->headers->set('Access-Control-Allow-Origin', '*');
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
        return $response;
    }

    public function __construct(EntityManagerInterface $entityManager, WebSocketNotifier $webSocketNotifier)
    {
        $this->entityManager = $entityManager;
        $this->webSocketNotifier = $webSocketNotifier;
    }

    #[Route('/books', name: 'book_list', methods: ['GET', 'OPTIONS'])]
    public function index(): JsonResponse
    {
        try {
            $books = $this->entityManager->getRepository(Book::class)->findAll();
            
            $data = [];
            foreach ($books as $book) {
                $data[] = [
                    'id' => $book->getId(),
                    'title' => $book->getTitle(),
                    'author' => $book->getAuthor(),
                    'is_available' => $book->getIsAvailable(),
                    'category' => $book->getCategory(),
                    'published_date' => $book->getPublishedDate() ? $book->getPublishedDate()->format('Y-m-d') : null
                ];
            }

            $response = $this->json($data);
            $response->headers->set('Access-Control-Allow-Origin', '*');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
            
            return $response;
        } catch (\Exception $e) {
            return $this->json([
                'status' => 'error',
                'message' => 'Error fetching books: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/books/{id}', name: 'book_show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $book = $this->entityManager->getRepository(Book::class)->find($id);

        if (!$book) {
            return $this->json(['message' => 'Book not found'], Response::HTTP_NOT_FOUND);
        }

        $data = [
            'id' => $book->getId(),
            'title' => $book->getTitle(),
            'author' => $book->getAuthor(),
            'is_available' => $book->getIsAvailable(),
            'category' => $book->getCategory()
        ];

        return $this->json($data);
    }

    #[Route('/books', name: 'book_create', methods: ['POST', 'OPTIONS'])]
    public function create(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \Exception('Invalid JSON data');
            }

            $book = new Book();
            $book->setTitle($data['title']);
            $book->setAuthor($data['author']);
            $book->setIsAvailable($data['is_available'] ?? true);
            $book->setCategory($data['category'] ?? '');
            
            if (isset($data['published_date'])) {
                $book->setPublishedDate(new \DateTime($data['published_date']));
            }

            $this->entityManager->persist($book);
            $this->entityManager->flush();

            // Préparer la réponse de succès
            $responseData = [
                'id' => $book->getId(),
                'title' => $book->getTitle(),
                'author' => $book->getAuthor(),
                'is_available' => $book->getIsAvailable(),
                'category' => $book->getCategory(),
                'message' => 'Book created successfully'
            ];

            // Essayer d'envoyer une notification WebSocket (sans bloquer la réponse)
            try {
                $this->webSocketNotifier->notify([
                    'action' => 'create',
                    'data' => $responseData
                ]);
            } catch (\Throwable $e) {
                // Journaliser l'erreur mais continuer
                error_log('Erreur WebSocketNotifier: ' . $e->getMessage());
            }

            $response = $this->json($responseData, Response::HTTP_CREATED);
            $response->headers->set('Access-Control-Allow-Origin', '*');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
            
            return $response;
            
        } catch (\Exception $e) {
            return $this->json([
                'status' => 'error',
                'message' => 'Error creating book: ' . $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }


    #[Route('/books/{id}', name: 'book_update', methods: ['PUT'])]
    public function update(Request $request, int $id): JsonResponse
    {
        $book = $this->entityManager->getRepository(Book::class)->find($id);

        if (!$book) {
            return $this->json(['message' => 'Book not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        $book->setTitle($data['title'] ?? $book->getTitle());
        $book->setAuthor($data['author'] ?? $book->getAuthor());
        
        if (isset($data['is_available'])) {
            $book->setIsAvailable($data['is_available']);
        }
        
        if (isset($data['category'])) {
            $book->setCategory($data['category']);
        }

        $this->entityManager->flush();

        return $this->json([
            'id' => $book->getId(),
            'title' => $book->getTitle(),
            'author' => $book->getAuthor(),
            'is_available' => $book->getIsAvailable(),
            'category' => $book->getCategory(),
            'message' => 'Book updated successfully'
        ]);
    }

    #[Route('/books/{id}', name: 'book_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $book = $this->entityManager->getRepository(Book::class)->find($id);

        if (!$book) {
            return $this->json(['message' => 'Book not found'], Response::HTTP_NOT_FOUND);
        }

        $this->entityManager->remove($book);
        $this->entityManager->flush();

        return $this->json(['message' => 'Book deleted successfully']);
    }
}

