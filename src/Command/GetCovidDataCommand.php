<?php

namespace App\Command;

use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bridge\Monolog\Logger;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\Process\Process;

class GetCovidDataCommand extends Command
{
    // to make your command lazily loaded, configure the $defaultName static property,
    // so it will be instantiated only when the command is actually called.
    public static $defaultName = 'covid19:get-covid-data';

    private const DATA_REPOSITORY = 'https://github.com/CSSEGISandData/COVID-19.git';
    public const DATA_REPOSITORY_NAME = 'COVID-19';

    /** @var SymfonyStyle */
    private $io;

    /** @var ContainerInterface */
    private $container;

    /** @var \Psr\Log\LoggerInterface|Logger */
    private $logger;

    /** @var string */
    private $dataDirectory;

    public function __construct(
        ContainerInterface $container,
        LoggerInterface $logger,
        ?string $name = null
    )
    {
        parent::__construct($name);
        $this->container = $container;
        $this->logger = $logger;
    }

    /**
     * {@inheritdoc}
     */
    protected function configure() : void
    {
        $this
            ->setDescription('Get Covid data')
            ->setHelp('No help available')
        ;
    }

    /**
     * This optional method is the first one executed for a command after configure()
     * and is useful to initialize properties based on the input arguments and options.
     *
     * @param \Symfony\Component\Console\Input\InputInterface   $input
     * @param \Symfony\Component\Console\Output\OutputInterface $output
     */
    protected function initialize(InputInterface $input, OutputInterface $output) : void
    {
        $this->io = new SymfonyStyle($input, $output);
        $this->dataDirectory = $this->container->getParameter('kernel.project_dir') . '/data';
    }


    /**
     * @param \Symfony\Component\Console\Input\InputInterface   $input
     * @param \Symfony\Component\Console\Output\OutputInterface $output
     *
     * @return int|null|void
     * @throws \Throwable
     */
    protected function execute(InputInterface $input, OutputInterface $output) : int
    {
        try
        {
            $this->io->writeln('Checking for new data');
            $this->io->writeln('Target dir: ' . $this->dataDirectory . '/' . GetCovidDataCommand::DATA_REPOSITORY_NAME);

            if (!is_dir($this->dataDirectory . '/' . GetCovidDataCommand::DATA_REPOSITORY_NAME))
            {
                $cmd = 'cd ' . $this->dataDirectory . ' && git clone ' . GetCovidDataCommand::DATA_REPOSITORY;
            }
            else
            {
                $cmd = 'cd ' . $this->dataDirectory . '/' . GetCovidDataCommand::DATA_REPOSITORY_NAME . ' && git pull';
            }

            $this->io->writeln('Execution ' . $cmd);
            $gitProcess = Process::fromShellCommandline($cmd);
            $gitProcess->run();

            while ($gitProcess->isRunning())
            {
                // waiting for process to finish
            }

            $this->io->writeln('Output: ' . $gitProcess->getOutput());


            $this->io->writeln('The recalculation of the container circuits has been completed.');
        }
        catch (\Throwable $throwable)
        {
            $this->io->writeln('RecalculationStockMinMax: The recalculation of the container circuits has been failed.');
            $this->logger->critical(
                'RecalculationStockMinMax: The recalculation of the container circuits has been failed. ' . $throwable->getMessage(),
                $throwable->getTrace()
            );
            $this->logger->critical($throwable->getMessage(), $throwable->getTrace());

            return 500;
        }

        return 0;
    }
}
