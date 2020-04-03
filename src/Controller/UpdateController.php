<?php

namespace App\Controller;

use App\Domain\Corona\AcquireDataService;
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
class UpdateController extends AbstractController
{
    /**
     * @var \App\Domain\Corona\AcquireDataService
     */
    private $dataService;

    public function __construct(AcquireDataService $dataService)
    {
        $this->dataService = $dataService;
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
     * @param \App\Domain\Corona\AcquireDataService $acquireDataService
     *
     * @param \Doctrine\ORM\EntityManagerInterface  $entityManager
     *
     * @param \Psr\Log\LoggerInterface              $logger
     *
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function reNewStats(
        AcquireDataService $acquireDataService,
        EntityManagerInterface $entityManager,
        LoggerInterface $logger
    ) : Response
    {
        if ($this->isGranted('ROLE_ADMIN'))
        {
            try
            {
                $entityManager->beginTransaction();
                $acquireDataService->truncateStats();
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
     * @Route("/update-yarn", name="update_yarn")
     *
     * @param \App\Domain\Update\UpdateService $updateService
     *
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function updateYarn(UpdateService $updateService) : Response
    {
        if ($this->isGranted('ROLE_ADMIN'))
        {
            $updateService->updateYarn();
        }

        return $this->redirectToRoute('home');
    }

    /**
     * @Route("/cache-clear", name="cache-clear")
     *
     * @param \App\Domain\Update\UpdateService $updateService
     *
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function cacheClear(UpdateService $updateService) : Response
    {
        if ($this->isGranted('ROLE_ADMIN'))
        {
            $updateService->cacheClear();
        }

        return $this->redirectToRoute('home');
    }
}
