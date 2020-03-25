<?php

namespace App\Controller;

use App\Domain\Corona\AquireDataService;
use App\Form\UploadCoronaStatsType;
use App\Repository\CoronaStatsRepository;
use Knp\Component\Pager\PaginatorInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Serializer\SerializerInterface;

/**
 * @Route("/map")
 */
class MapController extends AbstractController
{
    /**
     * @var \App\Domain\Corona\AquireDataService
     */
    private $dataService;

    public function __construct( AquireDataService $dataService)
    {
        $this->dataService = $dataService;
    }

    /**
     * @Route("/query", name="map_upload", methods={"POST"})
     * @param LoggerInterface                           $logger
     * @param \Symfony\Component\HttpFoundation\Request $request
     *
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function upload(LoggerInterface $logger, Request $request) : Response
    {
        try
        {
            $form = $this->createForm(UploadCoronaStatsType::class);
            $form->handleRequest($request);

            if ($form->isSubmitted() && $form->isValid())
            {
                $fileData = $form->getData();
                $files = $fileData['file'];
                if (\is_array($files))
                {
                    $this->dataService->multiUpload($files);
                }
                else
                {
                    /** @var UploadedFile $files */
                    $this->dataService->import($files->getClientOriginalName(), $files->getPathname());
                }
            }
        }
        catch (\Throwable $throwable)
        {
            $logger->error($throwable->getMessage(), $throwable->getTrace());
        }

        return $this->redirectToRoute('map_query');
    }

    /**
     * @Route("/query_map_data", name="map_json_data")
     *
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     */
    public function jsonData() : JsonResponse
    {
        $response = new JsonResponse();

        $response->setData($this->dataService->getChartResponse());

        return $response;
    }

}
