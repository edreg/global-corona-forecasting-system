<?php

namespace App\Controller;

use App\Entity\Continent;
use App\Form\ContinentType;
use App\Repository\ContinentRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

/**
 * @Route("/continent")
 */
class ContinentController extends AbstractController
{
    /**
     * @Route("/", name="continent_index", methods={"GET"})
     */
    public function index(ContinentRepository $continentRepository): Response
    {
        return $this->render('continent/index.html.twig', [
            'continents' => $continentRepository->findAll(),
        ]);
    }

    /**
     * @Route("/new", name="continent_new", methods={"GET","POST"})
     */
    public function new(Request $request): Response
    {
        $continent = new Continent();
        $form = $this->createForm(ContinentType::class, $continent);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $entityManager = $this->getDoctrine()->getManager();
            $entityManager->persist($continent);
            $entityManager->flush();

            return $this->redirectToRoute('continent_index');
        }

        return $this->render('continent/new.html.twig', [
            'continent' => $continent,
            'form' => $form->createView(),
        ]);
    }

    /**
     * @Route("/{id}", name="continent_show", methods={"GET"})
     */
    public function show(Continent $continent): Response
    {
        return $this->render('continent/show.html.twig', [
            'continent' => $continent,
        ]);
    }

    /**
     * @Route("/{id}/edit", name="continent_edit", methods={"GET","POST"})
     */
    public function edit(Request $request, Continent $continent): Response
    {
        $form = $this->createForm(ContinentType::class, $continent);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $this->getDoctrine()->getManager()->flush();

            return $this->redirectToRoute('continent_index');
        }

        return $this->render('continent/edit.html.twig', [
            'continent' => $continent,
            'form' => $form->createView(),
        ]);
    }

    /**
     * @Route("/{id}", name="continent_delete", methods={"DELETE"})
     */
    public function delete(Request $request, Continent $continent): Response
    {
        if ($this->isCsrfTokenValid('delete'.$continent->getId(), $request->request->get('_token'))) {
            $entityManager = $this->getDoctrine()->getManager();
            $entityManager->remove($continent);
            $entityManager->flush();
        }

        return $this->redirectToRoute('continent_index');
    }
}
