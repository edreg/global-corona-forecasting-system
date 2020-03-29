<?php

namespace App\Controller;

use App\Domain\Corona\AquireDataService;
use App\Domain\Init\InitDataService;
use App\Domain\Update\UpdateService;
use App\Repository\CoronaStatsRepository;
use Doctrine\ORM\EntityManagerInterface;
use Knp\Component\Pager\PaginatorInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Constraints\Date;

/**
 * @Route("/")
 */
class HomeController extends AbstractController
{
    /**
     * @var \Symfony\Component\Serializer\SerializerInterface
     */
    private $serializer;

    /**
     * @var \App\Domain\Corona\AquireDataService
     */
    private $dataService;

    public function __construct(SerializerInterface $serializer, AquireDataService $dataService)
    {
        $this->serializer = $serializer;
        $this->dataService = $dataService;
    }

    /**
     * @Route("/", name="index")
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function index() : Response
    {
        return $this->redirectToRoute('stats');
    }

    /**
     * @Route("/stats", name="stats")
     * @param \Psr\Log\LoggerInterface                  $logger
     * @param \App\Repository\CoronaStatsRepository     $coronaStatsRepository
     * @param \Knp\Component\Pager\PaginatorInterface   $paginator
     * @param \Symfony\Component\HttpFoundation\Request $request
     *
     * @return \Symfony\Component\HttpFoundation\Response
     * @throws \Doctrine\ORM\NonUniqueResultException
     */
    public function stats(
        LoggerInterface $logger,
        CoronaStatsRepository $coronaStatsRepository,
        PaginatorInterface $paginator,
        Request $request
    ) : Response
    {
        try
        {
            $this->dataService->checkForNewData();
        }
        catch (\Throwable $throwable)
        {
            $logger->error($throwable->getMessage(), $throwable->getTrace());
        }

        $earliestDate = (new \DateTime('2020-01-22'))->modify('midnight');
        $latestDateValue = (new \DateTime())->modify('-1 day')->modify('midnight');
        $datePickerFormat = 'm/d/Y';
        $queriedDateTime = \DateTime::createFromFormat($datePickerFormat, $request->query->get('date'));
        $dateToQueryRepository = $latestDateValue;

        if ($queriedDateTime instanceof \DateTime)
        {
            $queriedDateTime->modify('midnight');

            if ($earliestDate->getTimestamp() < $queriedDateTime->getTimestamp() && $queriedDateTime->getTimestamp() < $latestDateValue->getTimestamp())
            {
                $dateToQueryRepository = $queriedDateTime;
            }
        }


        $query = $coronaStatsRepository->getFindAllQuery($dateToQueryRepository);
//        $pagination = $paginator->paginate(
//            $query, /* query NOT result */
//            $request->query->getInt('page', 1), /*page number*/
//            200 /*limit per page*/
//        );
        //$form = $this->createForm(UploadCoronaStatsType::class)

        return $this->render(
            'map/index.html.twig',
            [
                'test'     => 'MapController',
                'statList' => $query->getResult(),
//                'pagination' => $pagination,
                'dateValue' => $dateToQueryRepository->format($datePickerFormat),
                //'form'     => $form->createView(),
                'configurationId' => 'corona-chart-config',
                'settings' => $this->serializer->serialize(
                    [
                        'jsonDataUrl'     => $this->generateUrl('map_json_data', [], UrlGeneratorInterface::ABSOLUTE_URL),
                        'data'            => [],
                        'tableChartDivId' => 'corona-chart-div',
                    ],
                    'json'
                )
            ]
        );
    }

    /**
     * @Route("/init", name="init")
     * @param \App\Domain\Init\InitDataService $dataService
     *
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function init(InitDataService $dataService) : Response
    {
        if ($this->isGranted('ROLE_ADMIN'))
        {
            $dataService->init();
        }

        return $this->redirectToRoute('home');
    }

    /**
     * @Route("/renew-stats", name="renew_stats")
     * @param \App\Domain\Corona\AquireDataService $aquireDataService
     * @param \App\Domain\Init\InitDataService     $dataService
     *
     * @param \Doctrine\ORM\EntityManagerInterface $entityManager
     *
     * @param \Psr\Log\LoggerInterface             $logger
     *
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function reNewStats(
        AquireDataService $aquireDataService,
        EntityManagerInterface $entityManager,
        LoggerInterface $logger
    ) : Response
    {
        if ($this->isGranted('ROLE_ADMIN'))
        {
            try
            {
                $entityManager->beginTransaction();
                $aquireDataService->truncateStats();
                $this->dataService->checkForNewData();
                $entityManager->commit();
                $entityManager->flush();
            }
            catch (\Throwable $throwable)
            {
                $entityManager->rollback();
                $logger->critical($throwable->getMessage(), $throwable->getTrace());
            }
        }

        return $this->redirectToRoute('stats');
    }

    /**
     * @Route("/update", name="update")
     *
     * @param \App\Domain\Update\UpdateService $updateService
     *
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function update(UpdateService $updateService) : Response
    {
        if ($this->isGranted('ROLE_ADMIN'))
        {
            $updateService->update();
        }

        return $this->redirectToRoute('home');
    }

    /**
     * @Route("/home", name="home")
     */
    public function home() : Response
    {
        return $this->render('index.html.twig', [
            'controller_name' => 'HomeController',
        ]);
    }
}
