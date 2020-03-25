<?php

namespace App\Domain\Init;

use App\Command\GetCovidDataCommand;
use App\Entity\City;
use App\Entity\Continent;
use App\Entity\CoronaStats;
use App\Entity\Country;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Finder\Finder;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Process\Process;
use Symfony\Component\Serializer\Encoder\CsvEncoder;
use Symfony\Component\Serializer\SerializerInterface;
use function file_get_contents;

class InitDataService
{
    /** @var \Doctrine\ORM\EntityManagerInterface */
    private $entityManager;

    /** @var \Symfony\Component\Serializer\SerializerInterface */
    private $serializer;

    /** @var \Doctrine\Persistence\ObjectRepository */
    private $countryRepository;

    /** @var \Doctrine\Persistence\ObjectRepository */
    private $cityRepository;

    /** @var string */
    private $dataPathWorldCities;

    /** @var string */
    private $dataPathCountries;

    /** @var string */
    private $dataPathPopulation;

    /** @var \Doctrine\Persistence\ObjectRepository */
    private $continentRepository;

    public function __construct(
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        ContainerInterface $container
    )
    {
        $this->entityManager = $entityManager;
        $this->serializer = $serializer;
        $this->countryRepository = $this->entityManager->getRepository(Country::class);
        $this->cityRepository = $this->entityManager->getRepository(City::class);
        $this->continentRepository = $this->entityManager->getRepository(Continent::class);
        $projectDirectory = $container->getParameter('kernel.project_dir');
        $this->dataPathWorldCities = $projectDirectory . '/data/worldcities.csv';
        $this->dataPathCountries = $projectDirectory . '/data/countries.csv';
        $this->dataPathPopulation = $projectDirectory . '/data/countrypopulation.csv';
    }

    public function init() : void
    {
        $data = $this->serializer->decode(file_get_contents($this->dataPathCountries), 'csv', [CsvEncoder::DELIMITER_KEY => ';']);

        $countriesByIso = [];
        //format $datum: iso2;latitude;longitude;name
        foreach ($data as $datum)
        {
            $name = $datum['name'];
            $country = $this->countryRepository->findOneBy(['name' => $name]);

            if (!($country instanceof Country))
            {
                $country = new Country();
                $country->setName($name);
                $country->setLatitude((float)$datum['latitude']);
                $country->setLongitude((float)$datum['longitude']);
                $country->setIso2(strtoupper($datum['iso2']));
                $country->setPopulation(0);
                $country->setCapital('');
                $this->entityManager->persist($country);
            }

            $countriesByIso[$country->getIso2()] = $country;
        }

        $this->entityManager->flush();

        $data = $this->serializer->decode(file_get_contents($this->dataPathPopulation), 'csv', [CsvEncoder::DELIMITER_KEY => ';']);

        //name;continent;population;iso2
        foreach ($data as $datum)
        {
            $continentName = $datum['continent'];
            $continent = $this->continentRepository->findOneBy(['name' => $continentName]);

            if (!($continent instanceof Continent))
            {
                $continent = new Continent();
                $continent->setName($continentName);
                $this->entityManager->persist($continent);
                $this->entityManager->flush();
            }

            $country = $countriesByIso[$datum['iso2']] ?? null;

            if ($country instanceof Country)
            {
                $country->setContinent($continent);
                $country->setPopulation((int)$datum['population']);
            }
        }

        $data = $this->serializer->decode(file_get_contents($this->dataPathWorldCities), 'csv');
        //format $datum: city,"city_ascii","lat","lng","country","iso2","iso3","admin_name","capital","population","id"
        foreach ($data as $datum)
        {
            $name = $datum['city_ascii'];
            $city = $this->cityRepository->findOneBy(['name' => $name]);
            $country = $countriesByIso[$datum['iso2']] ?? null;

            if (!($city instanceof City) && $country instanceof Country)
            {
                $city = new City();
                $city->setName($name);
                $city->setLatitude((float)$datum['lat']);
                $city->setLongitude((float)$datum['lng']);
                $city->setCountry($country);
                $city->setPopulation((int)$datum['population']);
                $this->entityManager->persist($city);
            }
        }

        $this->entityManager->flush();
    }

}
