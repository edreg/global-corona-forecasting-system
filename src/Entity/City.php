<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity(repositoryClass="App\Repository\CityRepository")
 */
class City
{
    /**
     * @ORM\Id()
     * @ORM\GeneratedValue()
     * @ORM\Column(type="integer")
     */
    private $id;

    /**
     * @ORM\Column(type="string", length=255)
     */
    private $name;

    /**
     * @ORM\Column(type="decimal", precision=27, scale=20)
     */
    private $latitude;

    /**
     * @ORM\Column(type="decimal", precision=27, scale=20)
     */
    private $longitude;

    /**
     * @ORM\Column(type="integer")
     */
    private $population;

    /**
     * @ORM\ManyToOne(targetEntity="App\Entity\Country", inversedBy="cities")
     */
    private $country;

    /**
     * @return mixed
     */
    public function getCountry()
    {
        return $this->country;
    }

    /**
     * @param mixed $country
     *
     * @return City
     */
    public function setCountry($country) : City
    {
        $this->country = $country;

        return $this;
    }

    public function __toString()
    {
        return $this->name;
    }

    public function getId() : ?int
    {
        return $this->id;
    }

    public function getName() : ?string
    {
        return $this->name;
    }

    public function setName(string $name) : self
    {
        $this->name = $name;

        return $this;
    }

    public function getLatitude() : ?string
    {
        return $this->latitude;
    }

    public function setLatitude(string $latitude) : self
    {
        $this->latitude = $latitude;

        return $this;
    }

    public function getLongitude() : ?string
    {
        return $this->longitude;
    }

    public function setLongitude(string $longitude) : self
    {
        $this->longitude = $longitude;

        return $this;
    }

    public function getPopulation() : ?int
    {
        return $this->population;
    }

    public function setPopulation(int $population) : self
    {
        $this->population = $population;

        return $this;
    }
}
