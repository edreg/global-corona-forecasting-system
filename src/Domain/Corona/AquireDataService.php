<?php

namespace App\Domain\Corona;

use App\Command\GetCovidDataCommand;
use App\Entity\CoronaStats;
use App\Entity\Country;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Finder\Finder;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Process\Process;
use Symfony\Component\Serializer\SerializerInterface;

/**
 * Class AquireDataService
 *
 * @data_source https://github.com/CSSEGISandData/COVID-19
 *
 * @package App\Domain\Corona
 */
class AquireDataService
{
    /** @var \Doctrine\ORM\EntityManagerInterface */
    private $entityManager;

    /** @var \Symfony\Component\Serializer\SerializerInterface */
    private $serializer;

    /** @var \Doctrine\Persistence\ObjectRepository */
    private $countryRepository;

    /** @var \Doctrine\Persistence\ObjectRepository */
    private $statsRepository;

    /** @var string */
    private $dataDirectory;

    /** @var string */
    private $projectDirectory;

    /** @var \Psr\Log\LoggerInterface */
    private $logger;

    public function __construct(
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        ContainerInterface $container,
        LoggerInterface $logger
    )
    {
        $this->entityManager = $entityManager;
        $this->serializer = $serializer;
        $this->countryRepository = $this->entityManager->getRepository(Country::class);
        $this->statsRepository = $this->entityManager->getRepository(CoronaStats::class);
        $this->dataDirectory = $container->getParameter('kernel.project_dir') . '/data/' . GetCovidDataCommand::DATA_REPOSITORY_NAME;
        $this->projectDirectory = $container->getParameter('kernel.project_dir') . '/';
        $this->logger = $logger;
    }

    public function checkForNewData() : void
    {
        $dateOfIssue = (new \DateTime())->setTime(0, 0, 0)->modify('-1 day'); // Update are provided at 23:59 UTC

        $stat = $this->statsRepository->findOneBy(['date' => $dateOfIssue]);

        if (!($stat instanceof CoronaStats))
        {
            $process = Process::fromShellCommandline('cd ' . $this->projectDirectory . ' && php bin/console ' . GetCovidDataCommand::$defaultName);
            $process->run();

            while ($process->isRunning())
            {
                //wait
            }

            $this->logger->info($process->getOutput());

            $finder = new Finder();

            $finder->files()->in($this->dataDirectory . '/csse_covid_19_data/csse_covid_19_daily_reports')->name('*.csv');

            foreach ($finder as $file)
            {
                $this->import($file->getRelativePathname(), $file->getRealPath());
            }
        }
    }

    public function multiUpload(array $files) : void
    {
        /** @var UploadedFile $file */
        foreach ($files as $file)
        {
            $this->import($file->getClientOriginalName(), $file->getPathname());
        }
    }

    /**
     * @throws \Doctrine\DBAL\DBALException
     */
    public function truncateStats() :void
    {
        $connection = $this->entityManager->getConnection();
        $platform   = $connection->getDatabasePlatform();

        $connection->executeUpdate($platform->getTruncateTableSQL('CoronaStats', true));
    }

    public function import($originalFileName, $pathName) : void
    {
        $dateString = \explode('.', $originalFileName)[0];
        if (\strpos($originalFileName, '_') !== false)
        {
            $dateString = \explode('_', $originalFileName)[0];
        }
        $dateOfIssue = \DateTime::createFromFormat('m-d-Y', $dateString)->setTime(0, 0, 0);
        $stat = $this->statsRepository->findOneBy(['date' => $dateOfIssue]);

        if ($stat instanceof CoronaStats)
        {
            return;
        }

        $countryMapping = [
            'Mainland China' => 'China',
            'Bahamas, The' => 'Bahamas',
            'The Bahamas' => 'Bahamas',
            'The Gambia' => 'Gambia',
            'Gambia, The' => 'Gambia',
            'Congo (Kinshasa)' => 'Congo [DRC]',
            'Congo (Brazzaville)' => 'Congo [Republic]',
            'Republic of the Congo' => 'Congo [Republic]',
            'Iran (Islamic Republic of)' => 'Iran',
            'Cabo Verde' => 'Cape Verde',
            'Republic of Korea' => 'South Korea',
            'Timor-Leste' => 'East Timor',
        ];

        $countrySkipList = [
            'Others' => true
        ];

        $statByCountryAndDateList = [];

        $data = $this->serializer->decode(\file_get_contents($pathName), 'csv');
        //new format from 2020-02-23
        //FIPS,Admin2,Province_State,Country_Region,Last_Update,Lat,Long_,Confirmed,Deaths,Recovered,Active,Combined_Key
        foreach ($data as $datum)
        {
            $nameToImport = trim($datum['Country/Region'] ?? $datum['Country_Region'] ?? '');

            $name = $countryMapping[$nameToImport] ?? $nameToImport;
            if (isset($countrySkipList[$name]) || empty($name))
            {
                continue;
            }
            $country = $this->getCountry($name);
            $countryId = $country->getId();
            $formattedDate = $dateOfIssue->format('Y-m-d');

            if (!isset($statByCountryAndDateList[$countryId][$formattedDate]))
            {
                $stat = new CoronaStats();
                $stat->setDate($dateOfIssue);
                $stat->setCountry($country);
                $stat->setAmount(0);
                $stat->setAmountHealed(0);
                $stat->setAmountDeath(0);
                $statByCountryAndDateList[$countryId][$formattedDate] = $stat;
            }

            $stat = $statByCountryAndDateList[$countryId][$formattedDate];
            $stat->setAmount($stat->getAmount() + (int)$datum['Confirmed']);
            $stat->setAmountHealed($stat->getAmountHealed() + (int)$datum['Recovered']);
            $stat->setAmountDeath($stat->getAmountDeath() + (int)$datum['Deaths']);

            $statByCountryAndDateList[$countryId][$formattedDate] = $stat;
            $this->entityManager->persist($stat);
        }

        $this->entityManager->flush();
    }

    /**
     * @param $name
     *
     * @return \App\Entity\Country|object|null
     */
    private function getCountry($name)
    {
        $country = $this->countryRepository->findOneBy(['name' => $name]);

        if (!($country instanceof Country))
        {
            $country = new Country();
            $country->setName($name);
            $country->setLatitude((float)0);
            $country->setLongitude((float)0);
            $country->setIso2('XXX');
            $country->setPopulation(0);
            $country->setCapital('');
            $this->entityManager->persist($country);
            $this->entityManager->flush();
        }

        return $country;
    }

    public function getChartResponse() : array
    {
        $countryEntityList = $this->countryRepository->findAll();
        $countryList = [];
        /** @var Country $country */
        foreach ($countryEntityList as $country)
        {
            $id = $country->getId();
            $name = $country->getName();
            if ($name === 'Cruise Ship')
            {
                continue;
            }
            $countryList[$id] = [
                'name' => $country->getName(),
                'id' => $id,
                'latitude' => $country->getLatitude(),
                'longitude' => $country->getLongitude(),
                'population' => $country->getPopulation(),
            ];
        }

        $statsEntityList = $this->statsRepository->findAll();
        $statsList = [];
        $dateList = [];

        /** @var CoronaStats $stats */
        foreach ($statsEntityList as $stats)
        {
            $date = $stats->getDate()->format('Y-m-d');
            $countryId = $stats->getCountry()->getId();
            $name = $stats->getCountry()->getName();
            if ($name === 'Cruise Ship')
            {
                continue;
            }
            $dateList[$date] = $date;

            if (!isset($statsList[$countryId][$date]))
            {
                $statsList[$countryId][$date] = [
                    'date' => $date,
                    'country' => $countryList[$countryId],
                    'amountTotal' => 0,
                    'amountTotalTheDayBefore' => 0,
                    'amountInfected' => 0,
                    'amountHealed' => 0,
                    'amountHealedTheDayBefore' => 0,
                    'amountDeath' => 0,
                    'amountDeathTheDayBefore' => 0,
                    'doublingInfectionRate' => 0,
                    'doublingDeathRate' => 0,
                    'doublingHealedRate' => 0,
                ];
            }

            $statsList[$countryId][$date]['amountTotal'] += $stats->getAmount();
            $statsList[$countryId][$date]['amountHealed'] += $stats->getAmountHealed();
            $statsList[$countryId][$date]['amountDeath'] += $stats->getAmountDeath();
            $statsList[$countryId][$date]['amountTotalTheDayBefore'] += $stats->getAmountTheDayBefore();
            $statsList[$countryId][$date]['amountHealedTheDayBefore'] += $stats->getAmountHealedTheDayBefore();
            $statsList[$countryId][$date]['amountDeathTheDayBefore'] += $stats->getAmountDeathTheDayBefore();
            $statsList[$countryId][$date]['doublingInfectionRate'] += $stats->getDoublingInfectionRateInDays();
            $statsList[$countryId][$date]['doublingDeathRate'] += $stats->getDoublingDeathRateInDays();
            $statsList[$countryId][$date]['doublingHealedRate'] += $stats->getDoublingHealedRateInDays();
        }

        asort($dateList);

        $statsResponse = [];

        foreach ($statsList as $id => $itemList)
        {
            $statsResponse[$id] = \array_values($itemList);
        }

        return [
            'countryList' => array_values($countryList),
            'data' => $statsResponse,
            'dateList' => array_values($dateList)
        ];
    }
}
