<?php

namespace App\Domain\Update;

use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Process\Process;

class UpdateService
{

    /**
     * @var \Psr\Log\LoggerInterface
     */
    private $logger;

    /**
     * @var string
     */
    private $projectDirectory;

    public function __construct(LoggerInterface $logger, ContainerInterface $container)
    {
        $this->projectDirectory = $container->getParameter('kernel.project_dir') . '/';
        $this->logger = $logger;
    }

    public function updateYarn() : void
    {
        $process = Process::fromShellCommandline('cd ' . $this->projectDirectory . ' && yarn encore prod');
        $process->run();

        while ($process->isRunning())
        {
            //wait
        }

        $this->logger->info($process->getOutput());
    }

    public function update() : void
    {
        $copyHtaccessCommand = 'cd ' . $this->projectDirectory . 'public && cp .htaccess.prod .htaccess';

        $process = Process::fromShellCommandline(
            'cd ' . $this->projectDirectory . ' && git pull && cp .env.prod .env && ' . $copyHtaccessCommand
            . ' && cd ' . $this->projectDirectory . ' && composer install && php bin/console cache:clear'
        );
        $process->run();

        while ($process->isRunning())
        {
            //wait
        }

        $this->logger->info($process->getOutput());
    }

}
