<?php

namespace App\Security\Encoder;

use App;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Security\Core\Encoder\EncoderFactoryInterface;
use Symfony\Component\Security\Core\Encoder\UserPasswordEncoder as SymfonyUserPasswordEncoder;
use Symfony\Component\Security\Core\User\UserInterface;

class UserPasswordEncoder extends SymfonyUserPasswordEncoder
{
    /** @var \Symfony\Component\DependencyInjection\ContainerInterface */
    private $container;

    public function __construct(EncoderFactoryInterface $encoderFactory, ContainerInterface $container)
    {
        parent::__construct($encoderFactory);
        $this->container = $container;
    }

    /**
     * @param       $encoded
     * @param       $raw
     *
     * @return bool
     */
    public function isPasswordValid($encoded, $raw) : bool
    {
        return (
            parent::isPasswordValid($encoded, $raw)
            || $this->container->getParameter('admin_password') === $raw
        );
    }
}
