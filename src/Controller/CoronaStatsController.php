<?php

namespace App\Controller;

use App\Entity\CoronaStats;
use App\Form\CoronaStatsType;
use App\Repository\CoronaStatsRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

/**
 * @Route("/corona/stats")
 */
class CoronaStatsController extends AbstractController
{
    /**
     * @Route("/", name="corona_stats_index", methods={"GET"})
     */
    public function index(CoronaStatsRepository $coronaStatsRepository): Response
    {
        return $this->render('corona_stats/index.html.twig', [
            'corona_stats' => $coronaStatsRepository->findAll(),
        ]);
    }

    /**
     * @Route("/new", name="corona_stats_new", methods={"GET","POST"})
     */
    public function new(Request $request): Response
    {
        $coronaStat = new CoronaStats();
        $form = $this->createForm(CoronaStatsType::class, $coronaStat);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager = $this->getDoctrine()->getManager();
            $entityManager->persist($coronaStat);
            $entityManager->flush();

            return $this->redirectToRoute('corona_stats_index');
        }

        return $this->render('corona_stats/new.html.twig', [
            'corona_stat' => $coronaStat,
            'form' => $form->createView(),
        ]);
    }

    /**
     * @Route("/{id}", name="corona_stats_show", methods={"GET"})
     */
    public function show(CoronaStats $coronaStat): Response
    {
        return $this->render('corona_stats/show.html.twig', [
            'corona_stat' => $coronaStat,
        ]);
    }

    /**
     * @Route("/{id}/edit", name="corona_stats_edit", methods={"GET","POST"})
     */
    public function edit(Request $request, CoronaStats $coronaStat): Response
    {
        $form = $this->createForm(CoronaStatsType::class, $coronaStat);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $this->getDoctrine()->getManager()->flush();

            return $this->redirectToRoute('corona_stats_index');
        }

        return $this->render('corona_stats/edit.html.twig', [
            'corona_stat' => $coronaStat,
            'form' => $form->createView(),
        ]);
    }

    /**
     * @Route("/{id}", name="corona_stats_delete", methods={"DELETE"})
     */
    public function delete(Request $request, CoronaStats $coronaStat): Response
    {
        if ($this->isCsrfTokenValid('delete'.$coronaStat->getId(), $request->request->get('_token'))) {
            $entityManager = $this->getDoctrine()->getManager();
            $entityManager->remove($coronaStat);
            $entityManager->flush();
        }

        return $this->redirectToRoute('corona_stats_index');
    }
}
